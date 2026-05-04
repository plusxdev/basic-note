/**
 * Cross-tab BroadcastChannel for crypto state. When one tab unlocks/locks
 * or rotates the master key, others react accordingly so we don't leave a
 * stale cryptoKey decrypting the wrong data.
 *
 * Handlers (in CryptoProvider):
 *  - lock / reset → always lock this tab
 *  - setup / unlock → only lock if our wrapper differs from sender's; same
 *    wrapper means same master key, so unlocking one tab shouldn't kick
 *    other tabs out.
 */

export const CRYPTO_BROADCAST_CHANNEL = "bn_crypto";

export type CryptoBroadcastMessage = {
  type: "setup" | "unlock" | "lock" | "reset";
  /** Sender's current encryptedMasterKey wrapper. */
  wrapper?: string;
};
