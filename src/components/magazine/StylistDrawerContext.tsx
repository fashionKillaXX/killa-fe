"use client";

/**
 * Lets pages set page_context the drawer should pass to /chat. Mounted
 * globally in Providers so the drawer can read whichever page is focused.
 */
import { createContext, useContext, useState, ReactNode } from "react";
import type { PageContext } from "@/services/feed";

interface StylistDrawerContextType {
  open: boolean;
  setOpen: (v: boolean) => void;
  pageContext: PageContext;
  setPageContext: (ctx: PageContext) => void;
}

const StylistDrawerContext = createContext<StylistDrawerContextType | undefined>(undefined);

export function StylistDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pageContext, setPageContext] = useState<PageContext>({ current_view: "feed" });
  return (
    <StylistDrawerContext.Provider value={{ open, setOpen, pageContext, setPageContext }}>
      {children}
    </StylistDrawerContext.Provider>
  );
}

export function useStylistDrawer() {
  const ctx = useContext(StylistDrawerContext);
  if (!ctx) throw new Error("useStylistDrawer must be used inside StylistDrawerProvider");
  return ctx;
}
