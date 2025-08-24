"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "../providers/AuthProvider";

export function useCliqueMembership(cliqueId: string) {
  const { user } = useAuth();
  const [isMember, setIsMember] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || !cliqueId) {
      setIsMember(false);
      return;
    }
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("clique_members")
        .select("clique_id")
        .eq("clique_id", cliqueId)
        .eq("user_id", user.id)
        .maybeSingle();
      setIsMember(!!data);
    })();
  }, [user, cliqueId]);

  return isMember;
}