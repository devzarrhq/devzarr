"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Member = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  voice: boolean;
};

type CliqueMembersContextType = {
  members: Member[];
  refresh: () => void;
  updateMember: (userId: string, changes: Partial<Member>) => void;
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
};

const CliqueMembersContext = createContext<CliqueMembersContextType | undefined>(undefined);

export function useCliqueMembers() {
  const ctx = useContext(CliqueMembersContext);
  if (!ctx) throw new Error("useCliqueMembers must be used within CliqueMembersProvider");
  return ctx;
}

export function CliqueMembersProvider({ cliqueId, initial, children }: { cliqueId: string; initial: Member[]; children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>(initial);

  // Fetch members from Supabase and update state
  const refresh = useCallback(async () => {
    const supabase = supabaseBrowser();
    const { data: rows } = await supabase
      .from("clique_members")
      .select("user_id, role, voice")
      .eq("clique_id", cliqueId)
      .order("user_id", { ascending: true });
    const ids = (rows ?? []).map(r => r.user_id);
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("user_id, handle, display_name, avatar_url").in("user_id", ids)
      : { data: [] as any[] };
    const merged = (rows ?? []).map(r => ({
      ...r,
      voice: !!r.voice,
      ...(profs?.find((p: any) => p.user_id === r.user_id) ?? { handle: null, display_name: null, avatar_url: null })
    }));
    setMembers(merged);
  }, [cliqueId]);

  // Real-time updates: listen for any change to clique_members for this clique
  useEffect(() => {
    const supabase = supabaseBrowser();
    const ch = supabase
      .channel(`cm:${cliqueId}`)
      .on("postgres_changes",
        { schema: "public", table: "clique_members", event: "*", filter: `clique_id=eq.${cliqueId}` },
        () => { refresh(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [cliqueId, refresh]);

  // Allow optimistic update for role/voice changes
  const updateMember = (userId: string, changes: Partial<Member>) => {
    setMembers(members =>
      members.map(m => m.user_id === userId ? { ...m, ...changes } : m)
    );
  };

  return (
    <CliqueMembersContext.Provider value={{ members, refresh, updateMember, setMembers }}>
      {children}
    </CliqueMembersContext.Provider>
  );
}