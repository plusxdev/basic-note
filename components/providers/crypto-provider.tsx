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
  createEncryptionSetup,
  verifyPassword,
  encrypt,
  decrypt,
} from "@/lib/crypto";
import { DEFAULT_LOCK_TIMEOUT_MINUTES } from "@/lib/constants";
import {
  syncPull,
  syncPush,
  syncPullSettings,
  syncPushSettings,
  startAutoSync,
  stopAutoSync,
} from "@/lib/sync/engine";

interface CryptoContextValue {
  /** Whether we have a master password set up at all */
  isSetup: boolean;
  /** Whether the app is currently unlocked */
  isUnlocked: boolean;
  /** Loading state while checking setup */
  isLoading: boolean;
  /** Current lock timeout in minutes */
  lockTimeoutMinutes: number;
  /** Set up the master password for the first time */
  setup: (password: string) => Promise<void>;
  /** Unlock with password */
  unlock: (password: string) => Promise<boolean>;
  /** Lock immediately */
  lock: () => void;
  /** Change the lock timeout */
  setLockTimeout: (minutes: number) => Promise<void>;
  /** Encrypt a string */
  encryptText: (plaintext: string) => Promise<string>;
  /** Decrypt a string */
  decryptText: (encrypted: string) => Promise<string>;
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

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoUnlockAttempted = useRef(false);

  // null = still loading, undefined = no settings, AppSettings = has settings
  const settings = useLiveQuery(() => db.settings.get("settings"), [], null);

  const isSetup = settings !== null && settings !== undefined;
  const isUnlocked = !!cryptoKey;

  // loading resolves once the query has returned (null → undefined or AppSettings)
  // If no local settings, try pulling from Supabase (new device scenario)
  useEffect(() => {
    if (settings === null) return; // still loading local query
    if (settings !== undefined) {
      setIsLoading(false);
      return;
    }
    // settings === undefined → no local settings, try remote
    syncPullSettings()
      .then(async (remote) => {
        if (remote) {
          await db.settings.put(remote);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [settings]);

  // Auto-unlock from session on refresh
  useEffect(() => {
    if (autoUnlockAttempted.current || !settings || cryptoKey) return;
    autoUnlockAttempted.current = true;
    const timeout = settings.lockTimeoutMinutes ?? DEFAULT_LOCK_TIMEOUT_MINUTES;
    const savedPw = loadSession(timeout);
    if (!savedPw) return;
    verifyPassword(savedPw, settings.encryptionSalt, settings.encryptionVerifier)
      .then((key) => {
        if (key) {
          setCryptoKey(key);
          saveSession(savedPw);
          syncPush().then(() => syncPull());
          startAutoSync();
        } else {
          clearSession();
        }
      })
      .catch(() => clearSession());
  }, [settings, cryptoKey]);

  // Safety timeout: force loading off if stuck (e.g. IndexedDB blocked)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // ── Idle auto-lock ──────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!cryptoKey) return;
    // Refresh session timestamp on activity
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

  // ── Actions ─────────────────────────────────────────────────
  const setup = useCallback(async (password: string) => {
    const { salt, verifier, key } = await createEncryptionSetup(password);
    const now = Date.now();
    await db.settings.put({
      id: "settings",
      encryptionSalt: salt,
      encryptionVerifier: verifier,
      lockTimeoutMinutes: DEFAULT_LOCK_TIMEOUT_MINUTES,
      defaultView: "list",
      createdAt: now,
      updatedAt: now,
    });
    setCryptoKey(key);
    saveSession(password);
    await syncPushSettings();
    startAutoSync();
  }, []);

  const unlock = useCallback(
    async (password: string): Promise<boolean> => {
      if (!settings) return false;
      const key = await verifyPassword(
        password,
        settings.encryptionSalt,
        settings.encryptionVerifier
      );
      if (key) {
        setCryptoKey(key);
        saveSession(password);
        syncPush().then(() => syncPull());
        startAutoSync();
        return true;
      }
      return false;
    },
    [settings]
  );

  const lock = useCallback(() => {
    stopAutoSync();
    clearSession();
    setCryptoKey(null);
  }, []);

  const setLockTimeout = useCallback(
    async (minutes: number) => {
      await db.settings.update("settings", {
        lockTimeoutMinutes: minutes,
        updatedAt: Date.now(),
      });
      await syncPushSettings();
    },
    []
  );

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
        setup,
        unlock,
        lock,
        setLockTimeout,
        encryptText,
        decryptText,
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
