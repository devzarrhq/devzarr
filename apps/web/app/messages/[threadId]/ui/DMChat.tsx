"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Msg = { id: string; author_id: string; body: string; created_at: string };

export default function DMChat({ threadId, initialMessages }: { threadId: string; initialMessages: Msg[] }) {
  const supabase = supabaseBrowser();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [showToast, setShowToast] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Always scroll to bottom when messages change
  useEffect(() => {
    if (box.current) {
      box.current.scrollTop = box.current.scrollHeight;
    }
  }, [messages]);

  // Real-time updates
  useEffect(() => {
    const ch = supabase
      .channel(`dm:${threadId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages", filter: `thread_id=eq.${threadId}` },
        payload => {
          setMessages(m => m.some(msg => msg.id === payload.new.id) ? m : [...m, payload.new as Msg]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Sign in first");
    setText(""); // clear input immediately
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);

    // Optimistically add message to UI
    const tempId = "temp-" + Math.random().toString(36).slice(2);
    const optimisticMsg: Msg = {
      id: tempId,
      author_id: user.id,
      body,
      created_at: new Date().toISOString(),
    };
    setMessages(m => [...m, optimisticMsg]);

    // Send to server
    const { data, error } = await supabase.from("dm_messages").insert({
      thread_id: threadId, author_id: user.id, body
    }).select("id, author_id, body, created_at").single();

    // Replace optimistic message with real one if available
    if (!error && data) {
      setMessages(m => m.map(msg => msg.id === tempId ? data : msg));
    } else {
      // Remove optimistic message on error
      setMessages(m => m.filter(msg => msg.id !== tempId));
      alert("Failed to send message.");
    }
  };

  // Enter = send, Shift+Enter = newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    // Shift+Enter: allow newline (do nothing)
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-2xl h-[600px] flex flex-col rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-lg">
        {/* Only this area scrolls */}
        <div
          ref={box}
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2"
        >
          {messages.map(m => (
            <div key={m.id} className="max-w-[70%] rounded-md px-3 py-2 bg-white/10 text-gray-100">
              <div className="text-[10px] text-gray-400">{new Date(m.created_at).toLocaleTimeString()}</div>
              <div className="whitespace-pre-wrap">{m.body}</div>
            </div>
          ))}
        </div>
        {/* Input area is always visible at the bottom */}
        <div className="p-3 flex gap-2 border-t border-white/10 bg-transparent">
          <textarea
            value={text}
            onChange={(e)=>setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="flex-1 rounded-lg bg-gray-800 text-white px-3 py-2 ring-1 ring-white/10 resize-none"
            placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
          />
          <button onClick={send} className="px-4 py-2 rounded-lg bg-emerald-500/90 text-white hover:bg-emerald-500">
            Send
          </button>
        </div>
      </div>
      {/* Toast: below the chat card, centered, green, readable */}
      {showToast && (
        <div className="w-full flex justify-center mt-3">
          <div className="text-emerald-400 font-semibold text-base animate-fade-in-out">
            Message sent!
          </div>
        </div>
      )}
      <style>{`
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(10px);}
          10% { opacity: 1; transform: translateY(0);}
          90% { opacity: 1; transform: translateY(0);}
          100% { opacity: 0; transform: translateY(-10px);}
        }
        .animate-fade-in-out {
          animation: fade-in-out 1.5s both;
        }
      `}</style>
    </div>
  );
}