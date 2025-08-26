"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Always allow access to /login and /profile/setup
  if (pathname === "/login" || pathname === "/profile/setup") return <>{children}</>;

  useEffect(() => {
    if (loading) return;
    if (!session) {
      if (typeof window !== "undefined") router.replace("/login");
      return;
    }
    // Check if profile is incomplete
    (async () => {
      if (!user) return;
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("profiles")
        .select("handle, display_name")
        .eq("user_id", user.id)
        .single();
      if (!data || !data.handle || !data.display_name) {
        if (pathname !== "/profile/setup") {
          router.replace("/profile/setup");
        }
      }
    })();
  }, [session, user, loading, router, pathname]);

  if (loading) return null; // or a spinner

  if (!session) return null;

  return <>{children}</>;
}