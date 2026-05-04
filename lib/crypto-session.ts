/**
 * Session storage for the user's password so we can auto-unlock after
 * reload until the lock timeout expires. The password itself never leaves
 * sessionStorage — only the timestamp is read to compute elapsed time.
 */

const SESSION_PW_KEY = "bn_session_pw";
const SESSION_TS_KEY = "bn_session_ts";

export function saveSession(password: string) {
  try {
    sessionStorage.setItem(SESSION_PW_KEY, password);
    sessionStorage.setItem(SESSION_TS_KEY, String(Date.now()));
  } catch {}
}

export function loadSession(timeoutMinutes: number): string | null {
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

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_PW_KEY);
    sessionStorage.removeItem(SESSION_TS_KEY);
  } catch {}
}

/**
 * Refresh the timestamp without touching the password. Used by the idle
 * timer so that user activity extends the auto-unlock window.
 */
export function touchSessionTimestamp() {
  try {
    const pw = sessionStorage.getItem(SESSION_PW_KEY);
    if (pw) sessionStorage.setItem(SESSION_TS_KEY, String(Date.now()));
  } catch {}
}
