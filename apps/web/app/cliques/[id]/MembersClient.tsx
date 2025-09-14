"use client";
import { useEffect, useState, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import CliqueUserList from "./CliqueUserList";
import { useAuth } from "../../providers/AuthProvider";

export default function MembersClient({ cliqueId, initial }: { cliqueId: string; initial: any[] }) {
  const { user } = useAuth();
  // Memoize supabase client so channel is stable
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [members, setMembers] = useState(initial);
  const [online, setOnline] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    const fetchMembers = async () => {
      const { data: rows } = await supabase
        .from("clique_members").select("user_id, role, voice").eq("clique_id", cliqueId);
      const ids = (rows ?? []).map(r => r.user_id);
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("user_id, handle, display_name, avatar_url").in("user_id", ids)
        : { data: [] as any[] };
      const merged = (rows ?? []).map(r => ({
        ...r,
        voice: !!r.voice, // always boolean
        ...(profs?.find(p => p.user_id === r.user_id) ?? {})
      }));
      if (mounted) setMembers(merged);
    };
    fetchMembers();

    // Listen for ALL changes (insert, update, delete) to clique_members for this clique
    const ch = supabase
      .channel(`cm:${cliqueId}`)
      .on("postgres_changes",
        { schema: "public", table: "clique_members", event: "*", filter: `clique_id=eq.${cliqueId}` },
        (payload) => {
          // Debug: log every event
          console.log("clique_members change event:", payload);
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliqueId, supabase]);

  // Presence (online users)
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`presence:${cliqueId}`, { config: { presence: { key: user.id } } });
    ch.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      await ch.track({ user_id: user.id });
    });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      const onlineSet = new Set(
        Object.values(state).flat().map((arr: any) => arr[0]?.user_id)
      );
      setOnline(onlineSet);
    });
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliqueId, user?.id, supabase]);

  return <CliqueUserList members={members} online={online} />;
}