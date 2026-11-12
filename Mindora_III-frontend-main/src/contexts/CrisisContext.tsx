"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type CrisisSource = "ai-chat" | "manual";

interface CrisisState {
  isOpen: boolean;
  source: CrisisSource | null;
  message: string | null;
}

interface CrisisContextValue extends CrisisState {
  trigger: (source: CrisisSource, message?: string | null) => void;
  dismiss: () => void;
}

const CLOSED: CrisisState = { isOpen: false, source: null, message: null };
const CrisisContext = createContext<CrisisContextValue | null>(null);

// Pure client state: opening never touches the network, so it works even if
// the API is down or errored.
export function CrisisProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CrisisState>(CLOSED);

  const trigger = useCallback((source: CrisisSource, message?: string | null) => {
    setState({ isOpen: true, source, message: message ?? null });
  }, []);
  const dismiss = useCallback(() => setState(CLOSED), []);

  const value = useMemo(() => ({ ...state, trigger, dismiss }), [state, trigger, dismiss]);
  return <CrisisContext.Provider value={value}>{children}</CrisisContext.Provider>;
}

export function useCrisis(): CrisisContextValue {
  const ctx = useContext(CrisisContext);
  if (!ctx) throw new Error("useCrisis must be used within CrisisProvider");
  return ctx;
}
