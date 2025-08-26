"use client";
import { createSupabaseServer } from "@/lib/supabase/server";
import DMChat from "./ui/DMChat";

export default async function ThreadPage({ params }: { params: { threadId: string } }) {
  const supabase = createSupabaseServer();
  // confirm membership
  const { data: t } = await supabase
    .from("dm_threads")
    .select("id, user_a, user_b")
    .eq("id", params.threadId)
    .single();
  if (!t) return <div className="p-8 text-gray-300">Thread not found.</div>;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-8 text-gray-300">Sign in to use DMs.</div>;

  const otherId = t.user_a === user.id ? t.user_b : t.user_a;
  const { data: other } = await supabase
    .from("profiles")
    .select("user_id, handle, display_name, avatar_url")
    .eq("user_id", otherId)
    .single();

  const { data: msgs } = await supabase
    .from("dm_messages")
    .select("id, author_id, body, created_at")
    .eq("thread_id", params.threadId)
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center gap-3 mb-6">
        {other?.avatar_url ? (
          <img src={other.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400 text-xl">?</span>
          </div>
        )}
        <div>
          <div className="font-semibold text-white text-lg">
            {other?.display_name || other?.handle || "User"}
          </div>
          <div className="text-xs text-gray-400">@{other?.handle}</div>
        </div>
      </div>
      <DMChat threadId={params.threadId} initialMessages={msgs ?? []} />
    </div>
  );
}