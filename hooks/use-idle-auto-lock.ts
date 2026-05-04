"use client";

import { useEffect, useRef } from "react";
import { touchSessionTimestamp } from "@/lib/crypto-session";
import { DEFAULT_LOCK_TIMEOUT_MINUTES } from "@/lib/constants";

const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
] as const;

/**
 * Lock the app after a period of user inactivity. While `enabled` is true,
 * any of the listed activity events resets the timer. Hitting the timeout
 * fires `onTimeout` once (typically the caller clears its session and
 * cryptoKey state).
 */
export function useIdleAutoLock({
  enabled,
  timeoutMinutes,
  onTimeout,
}: {
  enabled: boolean;
  timeoutMinutes: number | undefined;
  onTimeout: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled) return;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      touchSessionTimestamp();
      const minutes = timeoutMinutes ?? DEFAULT_LOCK_TIMEOUT_MINUTES;
      timerRef.current = setTimeout(
        () => onTimeoutRef.current(),
        minutes * 60 * 1000
      );
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, reset));
    reset();

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, timeoutMinutes]);
}
