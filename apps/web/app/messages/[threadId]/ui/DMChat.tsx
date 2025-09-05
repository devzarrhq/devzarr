"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Profile = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type Msg = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: Profile | null;
};

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DMChat({ threadId, initialMessages }: { threadId: string; initialMessages: Msg[] }) {
  const supabase = supabaseBrowser();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [text, setText] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom (with buffer)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight + 100, behavior: "smooth" });
    }
  }, [messages.length]);

  // Fetch user & message author profiles
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const authorIds = Array.from(new Set(messages.map(m => m.author_id)));
      if (authorIds.length === 0) return;

      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, handle, display_name, avatar_url")
        .in("user_id", authorIds);

      const map: Record<string, Profile> = {};
      (profs ?? []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);
    })();
  }, [messages.length]);

  // Live updates via Supabase channel
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
  }, [threadId]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Sign in first");

    setText("");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);

    const tempId = "temp-" + Math.random().toString(36).slice(2);
    const optimisticMsg: Msg = {
      id: tempId,
      author_id: user.id,
      body,
      created_at: new Date().toISOString(),
    };
    setMessages(m => [...m, optimisticMsg]);

    const { data, error } = await supabase.from("dm_messages").insert({
      thread_id: threadId, author_id: user.id, body
    }).select("id, author_id, body, created_at").single();

    if (!error && data) {
      setMessages(m => m.map(msg => msg.id === tempId ? data : msg));
    } else {
      setMessages(m => m.filter(msg => msg.id !== tempId));
      alert("Failed to send message.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="w-full flex justify-center flex-1 min-h-0">
      <div className="w-full max-w-2xl flex flex-col flex-1 min-h-0 rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-lg">
        {/* Scrollable message box with explicit height and modern scrollbar */}
        <div
          ref={box}
          className="overflow-y-auto w-full px-2 py-4 relative scroll-smooth custom-scrollbar"
          style={{
            height: "calc(100vh - 220px)", // Adjust as needed for your header/input bar
            overflowY: "auto",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 100%)",
          }}
        >
          <div className="flex flex-col gap-4 w-full pb-24">
            {messages.map((msg, idx) => {
              const isMe = msg.author_id === currentUserId;
              const prev = messages[idx - 1];
              const showAvatar = idx === 0 || prev?.author_id !== msg.author_id;
              const profile = profiles[msg.author_id];
              const displayName = profile?.display_name || profile?.handle || "User";
              const avatarUrl = profile?.avatar_url || "/images/default-avatar.png";

              return (
                <div
                  key={msg.id}
                  className={`flex items-end w-full ${isMe ? "justify-end pr-6" : "justify-start pl-6"}`}
                >
                  {!isMe && showAvatar && (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full mr-3 self-start"
                    />
                  )}
                  <div
                    className={`
                      max-w-[70%] px-4 py-2 rounded-lg text-sm shadow break-words
                      ${isMe
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-800 text-gray-100 rounded-bl-none"
                      }
                    `}
                    style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                  >
                    {!isMe && showAvatar && (
                      <div className="font-semibold text-xs mb-1 text-teal-400">
                        {displayName}
                      </div>
                    )}
                    <div className="whitespace-pre-line break-words">{msg.body}</div>
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                  {isMe && showAvatar && (
                    <img
                      src={avatarUrl}
                      alt="You"
                      className="w-8 h-8 rounded-full ml-3 self-start"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Input area */}
        <div className="p-3 flex gap-2 border-t border-white/10 bg-transparent">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="flex-1 rounded-lg bg-gray-800 text-white px-3 py-2 ring-1 ring-white/10 resize-none"
            placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
          />
          <button
            onClick={send}
            className="px-4 py-2 rounded-lg bg-emerald-500/90 text-white hover:bg-emerald-500"
          >
            Send
          </button>
        </div>

        {/* Toast */}
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
          /* Modern custom scrollbar */
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
    </div>
  );
}