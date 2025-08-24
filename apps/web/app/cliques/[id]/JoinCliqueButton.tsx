"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "../../providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function JoinCliqueButton({ cliqueId }: { cliqueId: string }) {
  const { user } = useAuth();
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
      className="px-6 py-2 rounded-lg bg-emerald-500/90 text-white font-semibold text-base hover:bg-emerald-500"
      onClick={join}
      disabled={loading}
    >
      {loading ? "Joining…" : "Join Clique"}
    </button>
  );
}