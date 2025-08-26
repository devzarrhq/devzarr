"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "../providers/AuthProvider";

export default function LoginPage() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <div className="bg-gray-900 rounded-2xl shadow-2xl px-8 py-10 max-w-md w-full flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">Sign in to Devzarr</h1>
        <Auth
          supabaseClient={supabaseBrowser()}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={[]}
          redirectTo={typeof window !== "undefined" ? window.location.origin : ""}
          view="sign_up"
        />
      </div>
    </div>
  );
}