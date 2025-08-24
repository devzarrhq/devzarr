"use client";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function FollowButton({ projectId, followerCount: initial }: { projectId: string; followerCount: number }) {
  const supabase = supabaseBrowser();
  const [count, setCount] = useState(initial);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsFollowing(false); return; }
      const { data } = await supabase.from("project_follows")
        .select("project_id").eq("project_id", projectId).eq("user_id", user.id).maybeSingle();
      setIsFollowing(!!data);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const toggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Sign in first"); return; }

    if (isFollowing) {
      const { error } = await supabase.from("project_follows")
        .delete().eq("project_id", projectId).eq("user_id", user.id);
      if (!error) { setIsFollowing(false); setCount(c => c - 1); }
    } else {
      const { error } = await supabase.from("project_follows")
        .insert({ project_id: projectId, user_id: user.id });
      if (!error) { setIsFollowing(true); setCount(c => c + 1); }
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={toggle}
        className={`px-4 py-2 rounded-lg text-sm font-semibold ${isFollowing ? "bg-white/10 text-white" : "bg-emerald-500/90 text-white hover:bg-emerald-500"}`}>
        {isFollowing ? "Following" : "Follow"}
      </button>
      <div className="text-gray-400 text-sm">{count} follower{count === 1 ? "" : "s"}</div>
    </div>
  );
}