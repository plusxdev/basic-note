"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  createMasterKeySetup,
  verifyAndUnwrapMasterKey,
  verifyPasswordLegacy,
  recoverMasterKey,
  rewrapMasterKey,
  generateMasterKey,
  generateRecoveryKey,
  normalizeRecoveryKey,
  wrapMasterKey,
  deriveKey,
  encrypt,
  decrypt,
} from "@/lib/crypto";
import { DEFAULT_LOCK_TIMEOUT_MINUTES, VERIFIER_PLAINTEXT } from "@/lib/constants";
import { RESET_PENDING_KEY, LAST_SYNC_KEY } from "@/lib/reset";
import { logDecryptFailure, LOCK_ERROR_MESSAGE } from "@/lib/decrypt-diagnostics";
import {
  syncPull,
  syncPush,
  syncPullSettings,
  syncPushSettings,
  startAutoSync,
  stopAutoSync,
} from "@/lib/sync/engine";
import {
  saveSession,
  loadSession,
  clearSession,
} from "@/lib/crypto-session";
import { migrateData } from "@/lib/migrate-master-key";
import {
  CRYPTO_BROADCAST_CHANNEL,
  type CryptoBroadcastMessage,
} from "@/lib/crypto-broadcast";
import { useIdleAutoLock } from "@/hooks/use-idle-auto-lock";

interface CryptoContextValue {
  isSetup: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  lockTimeoutMinutes: number;
  /** Non-null when user must save their recovery key (after setup or migration) */
  pendingRecoveryKey: string | null;
  setup: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  setLockTimeout: (minutes: number) => Promise<void>;
  encryptText: (plaintext: string) => Promise<string>;
  decryptText: (encrypted: string) => Promise<string>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  recoverWithKey: (recoveryKey: string, newPassword: string) => Promise<boolean>;
  getRecoveryKey: () => Promise<string | null>;
  dismissRecoveryKey: () => void;
}

const CryptoContext = createContext<CryptoContextValue | null>(null);

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRecoveryKey, setPendingRecoveryKey] = useState<string | null>(null);
  const autoUnlockAttempted = useRef(false);
  // Wrapper this cryptoKey was unwrapped from. If settings.encryptedMasterKey
  // later diverges (e.g., another tab re-keyed), our cryptoKey is stale.
  const loadedWrapperRef = useRef<string | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const settings = useLiveQuery(() => db.settings.get("settings"), [], null);

  const isSetup = settings !== null && settings !== undefined;
  const isUnlocked = !!cryptoKey;
  const isNewSchema = !!settings?.encryptedMasterKey;

  useEffect(() => {
    if (settings === null) return;
    if (settings !== undefined) {
      // settings가 로드됐어도, 저장된 세션이 있으면 auto-unlock effect가
      // 끝날 때 isLoading을 false로 풀도록 남겨둔다. 그렇지 않으면
      // 새로고침 시 "LockScreen 깜빡임 → 해제" 순서로 보이게 된다.
      const timeout = settings.lockTimeoutMinutes ?? DEFAULT_LOCK_TIMEOUT_MINUTES;
      const hasSavedSession = loadSession(timeout) !== null;
      if (!hasSavedSession) setIsLoading(false);
      return;
    }
    // After a reset, skip remote settings pull so the user can freshly set up
    // without the old encryptedMasterKey coming back from Supabase.
    if (
      typeof window !== "undefined" &&
      localStorage.getItem(RESET_PENDING_KEY) === "1"
    ) {
      setIsLoading(false);
      return;
    }
    syncPullSettings()
      .then(async (remote) => {
        if (remote) await db.settings.put(remote);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [settings]);

  // Auto-unlock from session
  useEffect(() => {
    if (autoUnlockAttempted.current || !settings || cryptoKey) return;
    autoUnlockAttempted.current = true;
    const timeout = settings.lockTimeoutMinutes ?? DEFAULT_LOCK_TIMEOUT_MINUTES;
    const savedPw = loadSession(timeout);
    if (!savedPw) return;

    const doAutoUnlock = async () => {
      let key: CryptoKey | null = null;
      if (settings.encryptedMasterKey) {
        key = await verifyAndUnwrapMasterKey(
          savedPw,
          settings.encryptionSalt,
          settings.encryptionVerifier,
          settings.encryptedMasterKey
        );
      } else {
        key = await verifyPasswordLegacy(
          savedPw,
          settings.encryptionSalt,
          settings.encryptionVerifier
        );
        // Don't auto-migrate on session restore to avoid surprise delays
        // Migration will happen on next manual unlock
      }
      if (key) {
        setCryptoKey(key);
        loadedWrapperRef.current = settings.encryptedMasterKey ?? null;
        saveSession(savedPw);
        syncPush().then(() => syncPull());
        startAutoSync();
      } else {
        clearSession();
      }
    };

    doAutoUnlock()
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));
  }, [settings, cryptoKey]);

  // Safety timeout
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Detect external re-key (another tab, sync pull, etc.). If the wrapper we
  // unwrapped from no longer matches the current settings, our cryptoKey is
  // stale — force-lock so the user re-unlocks with the correct wrapper.
  useEffect(() => {
    if (!cryptoKey || !settings) return;
    const currentWrapper = settings.encryptedMasterKey ?? null;
    const loaded = loadedWrapperRef.current;
    if (loaded && currentWrapper && loaded !== currentWrapper) {
      lock();
    }
  }, [settings?.encryptedMasterKey, cryptoKey]);

  // Cross-tab broadcast. Rules:
  //  - lock / reset → always lock this tab (security + data rotation)
  //  - setup / unlock → only lock if our wrapper differs from sender's, i.e.
  //    the master key actually changed. Same wrapper = same key = no-op so
  //    unlocking one tab doesn't kick the other out.
  useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel(CRYPTO_BROADCAST_CHANNEL);
    bcRef.current = bc;
    bc.onmessage = (event) => {
      const msg = event.data as CryptoBroadcastMessage | null;
      if (!msg?.type) return;

      const dropKey = () => {
        stopAutoSync();
        clearSession();
        setCryptoKey(null);
        loadedWrapperRef.current = null;
        autoUnlockAttempted.current = false;
      };

      if (msg.type === "lock" || msg.type === "reset") {
        dropKey();
        return;
      }

      // setup / unlock: compare wrappers
      if (msg.wrapper && loadedWrapperRef.current === msg.wrapper) {
        // Same master key — this tab is already in sync, do nothing.
        return;
      }
      dropKey();
    };
    return () => {
      bc.close();
      bcRef.current = null;
    };
  }, []);

  // ── Idle auto-lock ──────────────────────────────────────────
  // Soft-lock only: clear local key + session. Doesn't broadcast or stop
  // autoSync — those belong to the explicit lock() path.
  useIdleAutoLock({
    enabled: !!cryptoKey,
    timeoutMinutes: settings?.lockTimeoutMinutes,
    onTimeout: () => {
      clearSession();
      setCryptoKey(null);
    },
  });

  // ── Setup (first time) ─────────────────────────────────────
  const setup = useCallback(async (password: string) => {
    const result = await createMasterKeySetup(password);
    const now = Date.now();
    await db.settings.put({
      id: "settings",
      encryptionSalt: result.salt,
      encryptionVerifier: result.verifier,
      encryptedMasterKey: result.encryptedMasterKey,
      recoverySalt: result.recoverySalt,
      recoveryEncryptedMasterKey: result.recoveryEncryptedMasterKey,
      recoveryKeyEncrypted: result.recoveryKeyEncrypted,
      lockTimeoutMinutes: DEFAULT_LOCK_TIMEOUT_MINUTES,
      defaultView: "list",
      createdAt: now,
      updatedAt: now,
    });
    setCryptoKey(result.masterKey);
    loadedWrapperRef.current = result.encryptedMasterKey;
    saveSession(password);
    setPendingRecoveryKey(result.recoveryKey);
    // Advance sync cursor so any orphaned pre-setup entities are ignored
    try {
      localStorage.setItem(LAST_SYNC_KEY, String(now));
      localStorage.removeItem(RESET_PENDING_KEY);
    } catch {}
    await syncPushSettings();
    startAutoSync();
    try {
      bcRef.current?.postMessage({
        type: "setup",
        wrapper: result.encryptedMasterKey,
      } satisfies CryptoBroadcastMessage);
    } catch {}
  }, []);

  // ── Unlock ─────────────────────────────────────────────────
  const unlock = useCallback(
    async (password: string): Promise<boolean> => {
      if (!settings) return false;

      if (settings.encryptedMasterKey) {
        // New schema: unwrap master key
        const masterKey = await verifyAndUnwrapMasterKey(
          password,
          settings.encryptionSalt,
          settings.encryptionVerifier,
          settings.encryptedMasterKey
        );
        if (!masterKey) return false;
        setCryptoKey(masterKey);
        loadedWrapperRef.current = settings.encryptedMasterKey;
        saveSession(password);
        syncPush().then(() => syncPull());
        startAutoSync();
        try {
          bcRef.current?.postMessage({
            type: "unlock",
            wrapper: settings.encryptedMasterKey,
          } satisfies CryptoBroadcastMessage);
        } catch {}
        return true;
      }

      // Legacy schema: verify then migrate
      const oldKey = await verifyPasswordLegacy(
        password,
        settings.encryptionSalt,
        settings.encryptionVerifier
      );
      if (!oldKey) return false;

      // Migrate to master key architecture
      const masterKey = await generateMasterKey();
      await migrateData(oldKey, masterKey);

      // Setup wrapping + recovery
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const wrappingKey = await deriveKey(password, salt);
      const verifier = await encrypt(wrappingKey, VERIFIER_PLAINTEXT);
      const encryptedMasterKey = await wrapMasterKey(masterKey, wrappingKey);

      const recoveryKey = generateRecoveryKey();
      const recoverySalt = crypto.getRandomValues(new Uint8Array(16));
      const recoveryWrappingKey = await deriveKey(
        normalizeRecoveryKey(recoveryKey),
        recoverySalt
      );
      const recoveryEncryptedMasterKey = await wrapMasterKey(
        masterKey,
        recoveryWrappingKey
      );
      const recoveryKeyEncrypted = await encrypt(masterKey, recoveryKey);

      await db.settings.update("settings", {
        encryptionSalt: btoa(String.fromCharCode(...salt)),
        encryptionVerifier: verifier,
        encryptedMasterKey,
        recoverySalt: btoa(String.fromCharCode(...recoverySalt)),
        recoveryEncryptedMasterKey,
        recoveryKeyEncrypted,
        updatedAt: Date.now(),
      });

      setCryptoKey(masterKey);
      loadedWrapperRef.current = encryptedMasterKey;
      saveSession(password);
      setPendingRecoveryKey(recoveryKey);
      await syncPushSettings();
      syncPush().then(() => syncPull());
      startAutoSync();
      try {
        bcRef.current?.postMessage({
          type: "unlock",
          wrapper: encryptedMasterKey,
        } satisfies CryptoBroadcastMessage);
      } catch {}
      return true;
    },
    [settings]
  );

  // ── Lock ───────────────────────────────────────────────────
  const lock = useCallback(() => {
    stopAutoSync();
    clearSession();
    setCryptoKey(null);
    loadedWrapperRef.current = null;
    autoUnlockAttempted.current = false;
    try {
      bcRef.current?.postMessage({ type: "lock" } satisfies CryptoBroadcastMessage);
    } catch {}
  }, []);

  // ── Change Password ────────────────────────────────────────
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      if (!settings || !cryptoKey) return false;

      // Verify current password
      if (settings.encryptedMasterKey) {
        const check = await verifyAndUnwrapMasterKey(
          currentPassword,
          settings.encryptionSalt,
          settings.encryptionVerifier,
          settings.encryptedMasterKey
        );
        if (!check) return false;
      } else {
        const check = await verifyPasswordLegacy(
          currentPassword,
          settings.encryptionSalt,
          settings.encryptionVerifier
        );
        if (!check) return false;
      }

      // Re-wrap master key with new password
      const { salt, verifier, encryptedMasterKey } = await rewrapMasterKey(
        cryptoKey,
        newPassword
      );

      await db.settings.update("settings", {
        encryptionSalt: salt,
        encryptionVerifier: verifier,
        encryptedMasterKey,
        updatedAt: Date.now(),
      });

      loadedWrapperRef.current = encryptedMasterKey;
      saveSession(newPassword);
      await syncPushSettings();
      try {
        bcRef.current?.postMessage({
          type: "unlock",
          wrapper: encryptedMasterKey,
        } satisfies CryptoBroadcastMessage);
      } catch {}
      return true;
    },
    [settings, cryptoKey]
  );

  // ── Recover with Recovery Key ──────────────────────────────
  const recoverWithKey = useCallback(
    async (recoveryKey: string, newPassword: string): Promise<boolean> => {
      if (!settings?.recoverySalt || !settings?.recoveryEncryptedMasterKey) {
        return false;
      }

      const masterKey = await recoverMasterKey(
        recoveryKey,
        settings.recoverySalt,
        settings.recoveryEncryptedMasterKey
      );
      if (!masterKey) return false;

      // Re-wrap with new password
      const { salt, verifier, encryptedMasterKey } = await rewrapMasterKey(
        masterKey,
        newPassword
      );

      await db.settings.update("settings", {
        encryptionSalt: salt,
        encryptionVerifier: verifier,
        encryptedMasterKey,
        updatedAt: Date.now(),
      });

      setCryptoKey(masterKey);
      loadedWrapperRef.current = encryptedMasterKey;
      saveSession(newPassword);
      await syncPushSettings();
      syncPush().then(() => syncPull());
      startAutoSync();
      try {
        bcRef.current?.postMessage({
          type: "unlock",
          wrapper: encryptedMasterKey,
        } satisfies CryptoBroadcastMessage);
      } catch {}
      return true;
    },
    [settings]
  );

  // ── Get Recovery Key (from settings, decrypted) ────────────
  const getRecoveryKey = useCallback(async (): Promise<string | null> => {
    if (!cryptoKey || !settings?.recoveryKeyEncrypted) return null;
    try {
      return await decrypt(cryptoKey, settings.recoveryKeyEncrypted);
    } catch {
      return null;
    }
  }, [cryptoKey, settings?.recoveryKeyEncrypted]);

  const dismissRecoveryKey = useCallback(() => {
    setPendingRecoveryKey(null);
  }, []);

  // ── Lock Timeout ───────────────────────────────────────────
  const setLockTimeout = useCallback(async (minutes: number) => {
    await db.settings.update("settings", {
      lockTimeoutMinutes: minutes,
      updatedAt: Date.now(),
    });
    await syncPushSettings();
  }, []);

  // ── Encrypt / Decrypt ─────────────────────────────────────
  const encryptText = useCallback(
    async (plaintext: string): Promise<string> => {
      if (!cryptoKey) throw new Error("App is locked");
      return encrypt(cryptoKey, plaintext);
    },
    [cryptoKey]
  );

  const decryptText = useCallback(
    async (encrypted: string): Promise<string> => {
      if (!cryptoKey) throw new Error(LOCK_ERROR_MESSAGE);
      try {
        return await decrypt(cryptoKey, encrypted);
      } catch (e) {
        // Real decrypt failure (tag mismatch, corrupted ciphertext, wrong key).
        // Snapshot context so we can diagnose the next reported incident.
        logDecryptFailure(e, {
          loadedWrapper: loadedWrapperRef.current?.slice(0, 8) ?? null,
          currentWrapper: settings?.encryptedMasterKey?.slice(0, 8) ?? null,
          ct: encrypted?.slice(0, 20),
        });
        throw e;
      }
    },
    [cryptoKey, settings?.encryptedMasterKey]
  );

  return (
    <CryptoContext.Provider
      value={{
        isSetup,
        isUnlocked,
        isLoading,
        lockTimeoutMinutes: settings?.lockTimeoutMinutes ?? DEFAULT_LOCK_TIMEOUT_MINUTES,
        pendingRecoveryKey,
        setup,
        unlock,
        lock,
        setLockTimeout,
        encryptText,
        decryptText,
        changePassword,
        recoverWithKey,
        getRecoveryKey,
        dismissRecoveryKey,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto(): CryptoContextValue {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error("useCrypto must be used within CryptoProvider");
  return ctx;
}
