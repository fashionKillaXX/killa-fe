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
  getBrainSessionId,
  setBrainSessionId,
  startBrainSession,
} from "@/services/feed";

interface BrainSessionContextType {
  sessionId: string | null;
  isReady: boolean;
  // Wrap any save-style action: returns true if it ran, false if gated to sign-in.
  requireLogin: (then: () => void | Promise<void>) => boolean;
  loginGateOpen: boolean;
  closeLoginGate: () => void;
}

const BrainSessionContext = createContext<BrainSessionContextType | undefined>(undefined);

const PENDING_KEY = "fitcurry_pending_brain_action_v1";

export function BrainSessionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loginGateOpen, setLoginGateOpen] = useState(false);

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

  // When the user successfully logs in, drop the anon session id —
  // the backend uses the Bearer token from now on.
  useEffect(() => {
    if (isAuthenticated && sessionId) {
      // Note: we keep the brain session row in DB; the upgrade_anon_to_user
      // call should be wired in on a later iteration.
      setBrainSessionId("");
      setSessionId(null);
    }
  }, [isAuthenticated, sessionId]);

  const requireLogin = useCallback(
    (then: () => void | Promise<void>) => {
      if (isAuthenticated) {
        Promise.resolve(then()).catch((e) => console.error(e));
        return true;
      }
      setLoginGateOpen(true);
      // Persist the pending action label for UI hint
      try {
        localStorage.setItem(PENDING_KEY, "1");
      } catch {}
      return false;
    },
    [isAuthenticated],
  );

  const closeLoginGate = useCallback(() => setLoginGateOpen(false), []);

  return (
    <BrainSessionContext.Provider
      value={{ sessionId, isReady, requireLogin, loginGateOpen, closeLoginGate }}
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
