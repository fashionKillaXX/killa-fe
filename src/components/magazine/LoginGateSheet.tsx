"use client";

/**
 * Wraps the existing SignInSheet, opens it whenever BrainSessionContext
 * gates an action behind login. Shows a brief toast hint based on the
 * reason (save vs chat) so the user knows why the sheet appeared.
 */
import { useEffect } from "react";
import { SignInSheet } from "@/components/SignInSheet";
import { useBrainSession } from "@/contexts/BrainSessionContext";
import { toast } from "sonner";

const REASON_HINTS: Record<string, string> = {
  save: "Sign in to save outfits — we'll bring you right back.",
  chat: "Sign in to chat with the stylist — your message is queued up.",
};

export default function LoginGateSheet() {
  const { loginGateOpen, loginGateReason, closeLoginGate } = useBrainSession();

  useEffect(() => {
    if (loginGateOpen && loginGateReason) {
      const hint = REASON_HINTS[loginGateReason];
      if (hint) toast(hint, { duration: 4000 });
    }
  }, [loginGateOpen, loginGateReason]);

  return (
    <SignInSheet
      open={loginGateOpen}
      onOpenChange={(open) => {
        if (!open) closeLoginGate();
      }}
      // After sign-in succeeds, the BrainSessionContext effect detects
      // isAuthenticated=true and replays the pending action automatically.
      // We just close the sheet here (the requireLogin closure does the rest).
      onSignInSuccess={closeLoginGate}
    />
  );
}
