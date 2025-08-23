"use client";

import { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Always allow access to /login
  if (pathname === "/login") return <>{children}</>;

  if (loading) return null; // or a spinner

  if (!session) {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }

  return <>{children}</>;
}