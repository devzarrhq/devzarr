"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ChevronRight } from "lucide-react";

type Message = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: {
    handle?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

export default function Chat({ cliqueId, topic }: { cliqueId: string, topic?: string }) {
  const supabase = supabaseBrowser();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(topic || "");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const scroller = useRef<HTMLDivElement>(null);

  // Fetch current user
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    })();
  }, []);

  // Load messages
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("messages")
        .select("id, author_id, body, created_at")
        .eq("clique_id", cliqueId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (mounted) setMsgs(data ?? []);
      setLoading(false);
    })();

    // Subscribe to new messages
    const ch = supabase
      .channel(`clique:${cliqueId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `clique_id=eq.${cliqueId}` },
        payload => {
          setMsgs(m => m.some(msg => msg.id === payload.new.id) ? m : [...m, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliqueId]);

  // Scroll to bottom on new message
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight + 100, behavior: "smooth" });
  }, [msgs.length]);

  // Fetch author profiles
  useEffect(() => {
    const authorIds = Array.from(new Set(msgs.map(m => m.author_id)));
    if (authorIds.length === 0) return;
    (async () => {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, handle, display_name, avatar_url")
        .in("user_id", authorIds);
      const map: Record<string, any> = {};
      (profs ?? []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs.length]);

  // Handle /help command
  async function handleCommand(cmd: string) {
    if (cmd.trim() === "/help") {
      setShowHelp(true);
      return;
    }
    setToast("Unknown command.");
  }

  // Send message
  const send = async () => {
    const body = text.trim();
    if (!body) return;
    if (body.startsWith("/")) {
      await handleCommand(body);
      setText("");
      return;
    }
    if (!currentUserId) {
      setToast("Sign in first");
      return;
    }
    setSending(true);
    setText("");
    const tempId = "temp-" + Math.random().toString(36).slice(2);
    const optimisticMsg: Message = {
      id: tempId,
      author_id: currentUserId,
      body,
      created_at: new Date().toISOString(),
    };
    setMsgs(m => [...m, optimisticMsg]);
    const { data, error } = await supabase.from("messages").insert({
      clique_id: cliqueId, author_id: currentUserId, body
    }).select("id, author_id, body, created_at").single();
    if (!error && data) {
      setMsgs(m => m.map(msg => msg.id === tempId ? data : msg));
    } else {
      setMsgs(m => m.filter(msg => msg.id !== tempId));
      setToast("Failed to send message.");
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="w-full flex flex-col h-[500px] max-h-[60vh] bg-white/5 rounded-2xl ring-1 ring-white/10 shadow-lg">
      {/* Topic */}
      {currentTopic && (
        <div className="px-4 py-2 border-b border-white/10 text-emerald-300 font-semibold">
          Topic: {currentTopic}
        </div>
      )}
      {/* Messages */}
      <div
        ref={scroller}
        className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar"
        style={{ minHeight: 0 }}
      >
        {loading ? (
          <div className="text-gray-400">Loading…</div>
        ) : msgs.length === 0 ? (
          <div className="text-gray-400">No messages yet.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {msgs.map((msg, idx) => {
              const profile = profiles[msg.author_id];
              const displayName = profile?.display_name || profile?.handle || "User";
              const avatarUrl = profile?.avatar_url || "/images/default-avatar.png";
              return (
                <div
                  key={msg.id}
                  className="flex items-start gap-3 w-full"
                >
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-teal-400">{displayName}</span>
                      <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="bg-gray-800 text-gray-100 rounded-lg px-4 py-2 mt-1 text-sm break-words whitespace-pre-line">
                      {msg.body}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Input */}
      <div className="p-3 flex gap-2 border-t border-white/10 bg-transparent">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="flex-1 rounded-lg bg-gray-800 text-white px-3 py-2 ring-1 ring-white/10 resize-none"
          placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
          disabled={sending}
        />
        <button
          onClick={send}
          className="px-4 py-2 rounded-lg bg-emerald-500/90 text-white hover:bg-emerald-500"
          disabled={sending}
        >
          Send
        </button>
      </div>
      {/* Toast */}
      {toast && (
        <div className="w-full flex justify-center mt-3">
          <div className="text-emerald-400 font-semibold text-base animate-fade-in-out">
            {toast}
          </div>
        </div>
      )}
      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-lg w-full shadow-2xl ring-1 ring-white/10">
            <h2 className="text-xl font-bold mb-4 text-emerald-300">Clique Chat Help</h2>
            <ul className="text-gray-200 text-sm space-y-2">
              <li><b>/help</b> — Show this help dialog</li>
            </ul>
            <button
              className="mt-6 px-4 py-2 rounded bg-emerald-500 text-white font-semibold"
              onClick={() => setShowHelp(false)}
            >
              Close
            </button>
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
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #38bdf8 #23272f;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          background: #23272f;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #38bdf8 0%, #06d6a0 100%);
          border-radius: 8px;
          min-height: 40px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #06d6a0 0%, #38bdf8 100%);
        }
      `}</style>
    </div>
  );
}