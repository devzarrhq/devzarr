"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

// Simple linkify utility
function linkify(text: string) {
  const urlRegex = /((https?:\/\/[^\s]+))/g;
  return text.split(urlRegex).map((part, i) =>
    urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-emerald-300 break-all">{part}</a>
      : part
  );
}

type Message = {
  id: string;
  body: string;
  author_id: string;
  created_at: string;
  author?: {
    handle: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function Chat({ cliqueId }: { cliqueId: string }) {
  const supabase = supabaseBrowser();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: messages, error: msgError } = await supabase
        .from("messages")
        .select("id, body, author_id, created_at")
        .eq("clique_id", cliqueId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (msgError) {
        setMsgs([]);
        return;
      }
      if (!messages || messages.length === 0) {
        setMsgs([]);
        return;
      }

      // Get unique author_ids
      const authorIds = Array.from(new Set(messages.map((m: any) => m.author_id))).filter(Boolean);

      if (authorIds.length === 0) {
        setMsgs(messages);
        return;
      }

      // Fetch all profiles for these authors
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, handle, display_name, avatar_url")
        .in("user_id", authorIds);

      // Map profiles to messages
      const profileMap: Record<string, any> = {};
      (profiles ?? []).forEach((p: any) => {
        profileMap[p.user_id] = p;
      });

      const mapped = messages.map((m: any) => ({
        ...m,
        author: profileMap[m.author_id] || null,
      }));

      setMsgs(mapped);
      setTimeout(() => {
        scroller.current?.scrollTo(0, scroller.current.scrollHeight);
      }, 100);
    })();

    // Real-time: Listen for new messages
    const channel = supabase.channel(`clique:${cliqueId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `clique_id=eq.${cliqueId}` },
        async (payload) => {
          const m = payload.new as Message;
          const { data: author } = await supabase
            .from("profiles")
            .select("handle, display_name, avatar_url")
            .eq("user_id", m.author_id)
            .single();
          setMsgs((prev) => [
            ...prev,
            { ...m, author: author ? author : null },
          ]);
          setTimeout(() => {
            scroller.current?.scrollTo(0, scroller.current.scrollHeight);
          }, 100);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [cliqueId, supabase]);

  const send = async () => {
    if (!text.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Sign in first");
    const { error } = await supabase.from("messages").insert({
      clique_id: cliqueId,
      author_id: user.id,
      body: text.trim(),
    });
    if (!error) setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      send();
    }
    // Shift+Enter: allow newline (do nothing)
    // Enter alone: do nothing (no accidental send)
  };

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl bg-white/5 ring-1 ring-white/10">
      <div ref={scroller} className="flex-1 overflow-y-auto p-4 space-y-2">
        {msgs.length === 0 ? (
          <div className="text-gray-400 text-center w-full py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          msgs.map(m => (
            <div key={m.id} className="flex items-start gap-2 text-sm text-gray-100 bg-white/5 rounded-md px-3 py-2 w-fit max-w-[70%]">
              {/* Avatar */}
              {m.author?.avatar_url ? (
                <img
                  src={m.author.avatar_url}
                  alt={m.author.display_name || m.author.handle || "avatar"}
                  className="w-7 h-7 rounded-full object-cover mr-2"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-700 mr-2 flex items-center justify-center text-xs text-gray-400">
                  ?
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  {/* Name */}
                  <span className="font-semibold text-xs text-emerald-300">
                    {m.author?.display_name || m.author?.handle || "Anonymous"}
                  </span>
                  {/* Time */}
                  <span className="text-[10px] text-gray-400">
                    {new Date(m.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div>{linkify(m.body)}</div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-3 flex gap-2">
        <textarea
          value={text}
          onChange={(e)=>setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-lg bg-gray-800 text-white px-3 py-2 ring-1 ring-white/10 resize-none"
          placeholder="Say something nice…"
          rows={2}
        />
        <button onClick={send} className="px-4 py-2 rounded-lg bg-emerald-500/90 text-white hover:bg-emerald-500">
          Send
        </button>
      </div>
    </div>
  );
}