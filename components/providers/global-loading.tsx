"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface GlobalLoadingContextValue {
  isLoading: boolean;
  setActive: (id: string, active: boolean) => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextValue | null>(
  null
);

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Set<string>>(() => new Set());

  const setActiveFn = useCallback((id: string, val: boolean) => {
    setActive((prev) => {
      const hasId = prev.has(id);
      if (val === hasId) return prev;
      const next = new Set(prev);
      if (val) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ isLoading: active.size > 0, setActive: setActiveFn }),
    [active, setActiveFn]
  );

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading(): GlobalLoadingContextValue {
  const ctx = useContext(GlobalLoadingContext);
  if (!ctx)
    throw new Error(
      "useGlobalLoading must be used within GlobalLoadingProvider"
    );
  return ctx;
}

export function useLoadingIndicator(id: string, isLoading: boolean) {
  const { setActive } = useGlobalLoading();
  useEffect(() => {
    setActive(id, isLoading);
    return () => setActive(id, false);
  }, [id, isLoading, setActive]);
}
