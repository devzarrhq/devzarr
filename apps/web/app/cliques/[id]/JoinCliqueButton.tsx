"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "../../providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useTheme } from "../../theme-context";

export default function JoinCliqueButton({ cliqueId }: { cliqueId: string }) {
  const { user } = useAuth();
  const { accent } = useTheme();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const join = async () => {
    if (!user) {
      alert("Sign in to join this clique.");
      return;
    }
    setLoading(true);
    await supabaseBrowser().from("clique_members").insert({
      clique_id: cliqueId,
      user_id: user.id,
      role: "member",
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      className="px-6 py-2 rounded-lg text-white font-semibold text-base hover:opacity-90"
      style={{ background: `var(--tw-color-accent-${accent})` }}
      onClick={join}
      disabled={loading}
    >
      {loading ? "Joining…" : "Join Clique"}
    </button>
  );
}