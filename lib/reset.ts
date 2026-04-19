import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db";
import { stopAutoSync } from "@/lib/sync/engine";

/**
 * Permanently wipes all local and remote data, unregisters service workers,
 * clears browser storage, then reloads the app. Irreversible.
 */
export async function resetEverything() {
  stopAutoSync();

  try {
    await supabase
      .from("encrypted_entities")
      .delete()
      .neq("id", "___never___");
    await supabase
      .from("app_settings")
      .delete()
      .neq("id", "___never___");
  } catch (e) {
    console.error("[reset] remote wipe failed:", e);
  }

  await db.transaction(
    "rw",
    db.categories,
    db.notes,
    db.blocks,
    db.settings,
    async () => {
      await db.categories.clear();
      await db.notes.clear();
      await db.blocks.clear();
      await db.settings.clear();
    }
  );

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {}

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {}

  location.reload();
}
