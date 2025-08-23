"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "../theme-context";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}