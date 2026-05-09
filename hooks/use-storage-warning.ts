"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { estimateStorage, STORAGE_THRESHOLDS } from "@/lib/storage-estimate";
import { useCrypto } from "@/components/providers/crypto-provider";
import { useLanguage } from "@/components/providers/language-provider";

const WARNED_KEY = "bn_storage_warned_v1";

export function useStorageWarning() {
  const { isUnlocked } = useCrypto();
  const { t } = useLanguage();
  const ran = useRef(false);

  useEffect(() => {
    if (!isUnlocked) return;
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      const info = await estimateStorage();
      if (!info || info.percent <= 0) return;

      const reached = [...STORAGE_THRESHOLDS]
        .filter((th) => info.percent >= th)
        .pop();
      if (reached === undefined) return;

      let lastWarned = 0;
      try {
        lastWarned = Number(localStorage.getItem(WARNED_KEY) ?? 0);
      } catch {
        // storage disabled — skip dedup, still warn once per session
      }
      if (reached <= lastWarned) return;

      const message = t("storage.thresholdReached").replace(
        "{percent}",
        String(reached),
      );
      toast.warning(message);
      try {
        localStorage.setItem(WARNED_KEY, String(reached));
      } catch {
        // ignore
      }
    })();
  }, [isUnlocked, t]);
}
