"use client";

/**
 * Wraps the existing SignInSheet, opens it whenever BrainSessionContext.requireLogin
 * is called by an anonymous user trying to take a save-style action.
 */
import { SignInSheet } from "@/components/SignInSheet";
import { useBrainSession } from "@/contexts/BrainSessionContext";

export default function LoginGateSheet() {
  const { loginGateOpen, closeLoginGate } = useBrainSession();
  return (
    <SignInSheet
      open={loginGateOpen}
      onOpenChange={(open) => {
        if (!open) closeLoginGate();
      }}
    />
  );
}
