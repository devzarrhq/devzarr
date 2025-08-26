import { createSupabaseServer } from "@/lib/supabase/server";
import MessagesPageClient from "./MessagesPageClient";

export default async function MessagesPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-8 text-gray-300">Sign in to use DMs.</div>;

  const { data: threads } = await supabase
    .from("dm_threads")
    .select("id, user_a, user_b, created_at")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const otherIds = (threads ?? []).map(t => (t.user_a === user.id ? t.user_b : t.user_a));
  const { data: profs } = otherIds.length
    ? await supabase.from("profiles")
        .select("user_id, handle, display_name, avatar_url")
        .in("user_id", otherIds)
    : { data: [] as any[] };

  const rows = (threads ?? []).map(t => {
    const other = profs?.find(p => p.user_id === (t.user_a === user.id ? t.user_b : t.user_a));
    return { ...t, other };
  });

  return <MessagesPageClient rows={rows} />;
}