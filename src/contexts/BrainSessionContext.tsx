"use client";

/**
 * BrainSessionContext — bootstraps an anonymous brain session if needed,
 * exposes a helper to gate save-style actions behind login.
 *
 * The browse path is always open (anon allowed). When an anonymous user
 * tries to save / save_sku / purchase, the gate opens the SignInSheet.
 */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  clearBrainSessionId,
  getBrainSessionId,
  setBrainSessionId,
  startBrainSession,
  upgradeBrainSession,
} from "@/services/feed";

interface BrainSessionContextType {
  sessionId: string | null;
  isReady: boolean;
  // Wrap any save-style action: returns true if it ran, false if gated to sign-in.
  // The wrapped fn is replayed automatically once the user signs in.
  requireLogin: (then: () => void | Promise<void>) => boolean;
  loginGateOpen: boolean;
  loginGateReason: "save" | "chat" | null;
  openLoginGate: (reason?: "save" | "chat") => void;
  closeLoginGate: () => void;
}

const BrainSessionContext = createContext<BrainSessionContextType | undefined>(undefined);

// Module-level scratch-pad for the pending action that fires after login.
// We store the function (not just a marker) so the user is brought back to
// exactly what they wanted to do — save / chat / etc.
let _pendingAction: (() => void | Promise<void>) | null = null;

export function BrainSessionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loginGateOpen, setLoginGateOpen] = useState(false);
  const [loginGateReason, setLoginGateReason] = useState<"save" | "chat" | null>(null);

  // Bootstrap once
  useEffect(() => {
    let cancelled = false;
    const existing = getBrainSessionId();
    if (existing) {
      setSessionId(existing);
      setIsReady(true);
      return;
    }
    const hour = new Date().getHours();
    const weekday = new Date().getDay();
    startBrainSession({
      demographic: { age_band: "25-34", gender: "female" },
      geo: { city: "Bangalore", tier: 1, climate: "mild" },
      device_class: "premium",
      session_time: { hour, weekday },
      campaign_creative_tags: { aesthetic: ["minimalist"], occasion: ["casual", "work"] },
    })
      .then((sid) => {
        if (cancelled) return;
        setSessionId(sid);
        setIsReady(true);
      })
      .catch((e) => {
        // If the bootstrap fails (backend down), still mark ready so the UI
        // shows an empty state rather than spinning forever.
        console.error("Brain session bootstrap failed:", e);
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // When the user logs in: backfill anon brain state, drop the anon session id,
  // and replay the pending action that triggered the gate.
  useEffect(() => {
    if (!isAuthenticated || !sessionId) return;
    let cancelled = false;
    upgradeBrainSession(sessionId)
      .catch((e) => {
        // Best-effort — login still succeeds even if backfill fails.
        console.warn("Brain backfill failed:", e);
      })
      .finally(() => {
        if (cancelled) return;
        clearBrainSessionId();
        setSessionId(null);
        // Replay the action that opened the gate (save / chat / etc.)
        if (_pendingAction) {
          const fn = _pendingAction;
          _pendingAction = null;
          Promise.resolve(fn()).catch((e) => console.error(e));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, sessionId]);

  const openLoginGate = useCallback((reason: "save" | "chat" = "save") => {
    setLoginGateReason(reason);
    setLoginGateOpen(true);
  }, []);

  const requireLogin = useCallback(
    (then: () => void | Promise<void>, reason: "save" | "chat" = "save") => {
      if (isAuthenticated) {
        Promise.resolve(then()).catch((e) => console.error(e));
        return true;
      }
      _pendingAction = then;
      setLoginGateReason(reason);
      setLoginGateOpen(true);
      return false;
    },
    [isAuthenticated],
  );

  const closeLoginGate = useCallback(() => {
    setLoginGateOpen(false);
    setLoginGateReason(null);
    // User dismissed the gate without signing in — drop the pending action.
    _pendingAction = null;
  }, []);

  return (
    <BrainSessionContext.Provider
      value={{
        sessionId,
        isReady,
        requireLogin,
        loginGateOpen,
        loginGateReason,
        openLoginGate,
        closeLoginGate,
      }}
    >
      {children}
    </BrainSessionContext.Provider>
  );
}

export function useBrainSession() {
  const ctx = useContext(BrainSessionContext);
  if (!ctx) throw new Error("useBrainSession must be used inside BrainSessionProvider");
  return ctx;
}
