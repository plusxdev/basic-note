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
import {
  syncPull,
  syncPush,
  syncPullSettings,
  syncPushSettings,
  startAutoSync,
  stopAutoSync,
} from "@/lib/sync/engine";

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

const SESSION_PW_KEY = "bn_session_pw";
const SESSION_TS_KEY = "bn_session_ts";

function saveSession(password: string) {
  try {
    sessionStorage.setItem(SESSION_PW_KEY, password);
    sessionStorage.setItem(SESSION_TS_KEY, String(Date.now()));
  } catch {}
}

function loadSession(timeoutMinutes: number): string | null {
  try {
    if (timeoutMinutes === 0) return null;
    const pw = sessionStorage.getItem(SESSION_PW_KEY);
    const ts = sessionStorage.getItem(SESSION_TS_KEY);
    if (!pw || !ts) return null;
    const elapsed = Date.now() - Number(ts);
    if (elapsed > timeoutMinutes * 60 * 1000) {
      clearSession();
      return null;
    }
    return pw;
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_PW_KEY);
    sessionStorage.removeItem(SESSION_TS_KEY);
  } catch {}
}

const CryptoContext = createContext<CryptoContextValue | null>(null);

// ─── Migration: re-encrypt all data from old key to new master key ──

async function migrateData(
  oldKey: CryptoKey,
  masterKey: CryptoKey
) {
  const categories = await db.categories.toArray();
  const notes = await db.notes.toArray();
  const blocks = await db.blocks.toArray();

  // Decrypt all with old key
  const plainCats = await Promise.all(
    categories.map(async (c) => {
      try {
        return { ...c, name: c.name ? await decrypt(oldKey, c.name) : "" };
      } catch {
        return c;
      }
    })
  );
  const plainNotes = await Promise.all(
    notes.map(async (n) => {
      try {
        return { ...n, title: n.title ? await decrypt(oldKey, n.title) : "" };
      } catch {
        return n;
      }
    })
  );
  const plainBlocks = await Promise.all(
    blocks.map(async (b) => {
      try {
        return { ...b, content: b.content ? await decrypt(oldKey, b.content) : "" };
      } catch {
        return b;
      }
    })
  );

  // Re-encrypt with master key
  const encCats = await Promise.all(
    plainCats.map(async (c) => ({
      ...c,
      name: c.name ? await encrypt(masterKey, c.name) : "",
    }))
  );
  const encNotes = await Promise.all(
    plainNotes.map(async (n) => ({
      ...n,
      title: n.title ? await encrypt(masterKey, n.title) : "",
    }))
  );
  const encBlocks = await Promise.all(
    plainBlocks.map(async (b) => ({
      ...b,
      content: b.content ? await encrypt(masterKey, b.content) : "",
    }))
  );

  // Write to DB in transaction
  await db.transaction(
    "rw",
    db.categories,
    db.notes,
    db.blocks,
    async () => {
      await db.categories.bulkPut(encCats);
      await db.notes.bulkPut(encNotes);
      await db.blocks.bulkPut(encBlocks);
    }
  );
}

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRecoveryKey, setPendingRecoveryKey] = useState<string | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoUnlockAttempted = useRef(false);

  const settings = useLiveQuery(() => db.settings.get("settings"), [], null);

  const isSetup = settings !== null && settings !== undefined;
  const isUnlocked = !!cryptoKey;
  const isNewSchema = !!settings?.encryptedMasterKey;

  useEffect(() => {
    if (settings === null) return;
    if (settings !== undefined) {
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
        saveSession(savedPw);
        syncPush().then(() => syncPull());
        startAutoSync();
      } else {
        clearSession();
      }
    };

    doAutoUnlock().catch(() => clearSession());
  }, [settings, cryptoKey]);

  // Safety timeout
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // ── Idle auto-lock ──────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!cryptoKey) return;
    try {
      const pw = sessionStorage.getItem(SESSION_PW_KEY);
      if (pw) sessionStorage.setItem(SESSION_TS_KEY, String(Date.now()));
    } catch {}

    const timeout = settings?.lockTimeoutMinutes ?? DEFAULT_LOCK_TIMEOUT_MINUTES;
    idleTimerRef.current = setTimeout(() => {
      clearSession();
      setCryptoKey(null);
    }, timeout * 60 * 1000);
  }, [cryptoKey, settings?.lockTimeoutMinutes]);

  useEffect(() => {
    if (!cryptoKey) return;
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));
    resetIdleTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [cryptoKey, resetIdleTimer]);

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
    saveSession(password);
    setPendingRecoveryKey(result.recoveryKey);
    await syncPushSettings();
    startAutoSync();
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
        saveSession(password);
        syncPush().then(() => syncPull());
        startAutoSync();
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
      saveSession(password);
      setPendingRecoveryKey(recoveryKey);
      await syncPushSettings();
      syncPush().then(() => syncPull());
      startAutoSync();
      return true;
    },
    [settings]
  );

  // ── Lock ───────────────────────────────────────────────────
  const lock = useCallback(() => {
    stopAutoSync();
    clearSession();
    setCryptoKey(null);
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

      saveSession(newPassword);
      await syncPushSettings();
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
      saveSession(newPassword);
      await syncPushSettings();
      syncPush().then(() => syncPull());
      startAutoSync();
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
      if (!cryptoKey) throw new Error("App is locked");
      return decrypt(cryptoKey, encrypted);
    },
    [cryptoKey]
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
