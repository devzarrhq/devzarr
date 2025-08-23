"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "../theme-context";
import { AuthProvider } from "./AuthProvider";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}