"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Chat({ cliqueId }: { cliqueId: string }) {
  const supabase = supabaseBrowser();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, body, author_id, created_at")
        .eq("clique_id", cliqueId)
        .order("created_at", { ascending: true })
        .limit(100);
      setMsgs(data ?? []);
      scroller.current?.scrollTo(0, scroller.current.scrollHeight);
    })();

    const channel = supabase.channel(`clique:${cliqueId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `clique_id=eq.${cliqueId}` },
        (payload) => {
          setMsgs((m) => [...m, payload.new as any]);
          scroller.current?.scrollTo(0, scroller.current.scrollHeight);
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

  // TODO: For message editing, add an 'edited_at' column to messages and update it on edit.

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl bg-white/5 ring-1 ring-white/10">
      <div ref={scroller} className="flex-1 overflow-y-auto p-4 space-y-2">
        {msgs.map(m => (
          <div key={m.id} className="text-sm text-gray-100 bg-white/5 rounded-md px-3 py-2 w-fit max-w-[70%]">
            <div className="text-[10px] text-gray-400">{new Date(m.created_at).toLocaleTimeString()}</div>
            <div>{m.body}</div>
          </div>
        ))}
      </div>
      <div className="p-3 flex gap-2">
        <input
          value={text}
          onChange={(e)=>setText(e.target.value)}
          onKeyDown={(e)=>{ if ((e.metaKey||e.ctrlKey)&&e.key==="Enter") send(); }}
          className="flex-1 rounded-lg bg-gray-800 text-white px-3 py-2 ring-1 ring-white/10"
          placeholder="Say something nice…"
        />
        <button onClick={send} className="px-4 py-2 rounded-lg bg-emerald-500/90 text-white hover:bg-emerald-500">
          Send
        </button>
      </div>
    </div>
  );
}