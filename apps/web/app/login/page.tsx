"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "../providers/AuthProvider";

export default function LoginPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"sign_in" | "sign_up">("sign_up");

  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [session, router]);

  // Listen for view changes from the Auth UI
  useEffect(() => {
    // Supabase Auth UI does not expose a callback for view changes,
    // so we can use a MutationObserver as a workaround.
    // This is a hack, but works for now.
    const observer = new MutationObserver(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn && btn.textContent?.toLowerCase().includes("sign up")) setView("sign_up");
      else setView("sign_in");
    });
    const root = document.getElementById("supabase-auth-root");
    if (root) observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <div className="bg-gray-900 rounded-2xl shadow-2xl px-8 py-10 max-w-md w-full flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">
          {view === "sign_up" ? "Sign up for Devzarr" : "Sign in to Devzarr"}
        </h1>
        <style>{`
          /* Hide default Supabase Auth UI heading */
          .sbui-auth-title { display: none !important; }
        `}</style>
        <div id="supabase-auth-root" className="w-full">
          <Auth
            supabaseClient={supabaseBrowser()}
            appearance={{
              theme: ThemeSupa,
            }}
            theme="dark"
            providers={[]}
            redirectTo={typeof window !== "undefined" ? window.location.origin : ""}
            view="sign_up"
          />
        </div>
      </div>
    </div>
  );
}