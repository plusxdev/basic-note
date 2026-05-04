import { db } from "./db";
import { decrypt, encrypt } from "./crypto";

/**
 * Re-encrypt all categories and notes from `oldKey` to `masterKey`. Used
 * during the legacy → master-key schema upgrade and during password
 * recovery, where the stored master key changes underneath existing
 * ciphertexts. Items that fail to decrypt with `oldKey` are left as-is so
 * we don't compound corruption with double-encryption — they surface in
 * the UI as "(복호화 실패)" instead.
 */
export async function migrateData(oldKey: CryptoKey, masterKey: CryptoKey) {
  const categories = await db.categories.toArray();
  const notes = await db.notes.toArray();

  const encCats: typeof categories = [];
  for (const c of categories) {
    if (!c.name) {
      encCats.push({ ...c, name: "" });
      continue;
    }
    try {
      const plain = await decrypt(oldKey, c.name);
      encCats.push({ ...c, name: await encrypt(masterKey, plain) });
    } catch {
      // skip — leaving as-is is safer than re-encrypting a ciphertext
    }
  }

  const encNotes: typeof notes = [];
  for (const n of notes) {
    const next = { ...n };
    if (n.title) {
      try {
        next.title = await encrypt(masterKey, await decrypt(oldKey, n.title));
      } catch {}
    }
    if (n.content) {
      try {
        next.content = await encrypt(
          masterKey,
          await decrypt(oldKey, n.content)
        );
      } catch {}
    }
    encNotes.push(next);
  }

  await db.transaction("rw", db.categories, db.notes, async () => {
    if (encCats.length) await db.categories.bulkPut(encCats);
    if (encNotes.length) await db.notes.bulkPut(encNotes);
  });
}
