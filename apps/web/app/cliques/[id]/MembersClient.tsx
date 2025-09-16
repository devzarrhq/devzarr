"use client";
import { useEffect, useState, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import CliqueUserList from "./CliqueUserList";
import { useAuth } from "../../providers/AuthProvider";
import { useCliqueMembers } from "./CliqueMembersContext";

export default function MembersClient({ cliqueId }: { cliqueId: string }) {
  const { user } = useAuth();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { members } = useCliqueMembers();
  const [online, setOnline] = useState<Set<string>>(new Set());

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
  }, [cliqueId, user?.id, supabase]);

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-300px)] border border-white">
      <CliqueUserList members={members} online={online} />
    </div>
  );
}