"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ChevronRight } from "lucide-react";
import { useCliqueMembers } from "./[id]/CliqueMembersContext";
import SystemMessage from "./SystemMessage";
import UserMessage from "./UserMessage";

// Utility for relative time
function timeAgo(date: string | Date) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr${Math.floor(diff / 3600) === 1 ? "" : "s"} ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? "" : "s"} ago`;
  return then.toLocaleDateString();
}

const HELP_COMMANDS = [
  { cmd: "/topic <new topic>", desc: "Set the channel topic (owner/mod only, if +t)" },
  { cmd: "/mode @user +m/-m/+v/-v/+o/-o", desc: "Promote/demote moderator, give/remove voice, or promote/demote owner" },
  { cmd: "/mode +t/-t", desc: "Lock/unlock topic (only mods/ops can change topic)" },
  { cmd: "/mode +m/-m", desc: "Enable/disable moderated chat (only +v, +o, +m can talk)" },
  { cmd: "/kick @user", desc: "Remove a user from the clique (owner/mod only)" },
  { cmd: "/ban @user", desc: "Ban a user from the clique (owner/mod only)" },
  { cmd: "/help", desc: "Show this help popup" },
];

type Message = {
  id: string;
  body: string;
  author_id: string;
  created_at: string;
  is_system?: boolean;
  system_type?: string | null;
  author?: {
    handle: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function Chat({ cliqueId, topic }: { cliqueId: string; topic?: string }) {
  const supabase = supabaseBrowser();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(topic || "");
  const [topicLocked, setTopicLocked] = useState(false);
  const [moderated, setModerated] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserVoice, setCurrentUserVoice] = useState<boolean>(false);
  const scroller = useRef<HTMLDivElement>(null);

  const { members } = useCliqueMembers();

  const memberRoles = members.reduce((acc, m) => {
    acc[m.user_id] = { role: m.role, voice: !!m.voice };
    return acc;
  }, {} as Record<string, { role: string; voice: boolean }>);

  // --- fetching, commands, send, etc. remain unchanged ---
  // (I’m trimming for clarity; your original logic stays as-is)

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom || el.scrollTop === 0) {
      el.scrollTo({ top: el.scrollHeight + 100, behavior: "smooth" });
    }
  }, [msgs.length]);

  let modeString = "";
  if (topicLocked) modeString += "t";
  if (moderated) modeString += "m";
  const displayModes = modeString ? `[+${modeString}]` : "";
  const displayTopic = currentTopic?.trim() ? currentTopic : "Welcome to the clique";

  return (
    <div className="w-full flex flex-col flex-1 min-h-0">
      {/* Topic bar */}
      <div className="px-4 py-2 bg-emerald-900/20 text-emerald-300 font-semibold text-center border-b border-emerald-700 flex items-center justify-center gap-2 rounded-t-2xl">
        <span>Topic: {displayTopic}</span>
        {displayModes && (
          <span className="ml-2 text-xs text-emerald-400 font-mono">{displayModes}</span>
        )}
      </div>

      {/* Messages + Input stacked */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Scrollable messages */}
        <div
          ref={scroller}
          className="flex-1 min-h-0 overflow-y-auto w-full px-2 py-4 scroll-smooth custom-scrollbar"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 100%)",
          }}
        >
          <div className="flex flex-col gap-4 w-full pb-24">
            {msgs.length === 0 ? (
              <div className="text-gray-400 text-center w-full py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              msgs.map(m =>
                m.is_system ? (
                  <SystemMessage key={m.id} body={m.body} created_at={m.created_at} />
                ) : (
                  <UserMessage
                    key={m.id}
                    msg={m}
                    cliqueId={cliqueId}
                    memberRoles={memberRoles}
                    timeAgo={timeAgo}
                  />
                )
              )
            )}
          </div>
        </div>

        {/* Input bar */}
        <div className="p-3 flex gap-2 border-t border-white/10 bg-transparent rounded-b-2xl">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="flex-1 rounded-lg bg-gray-800 text-white px-3 py-2 ring-1 ring-white/10 resize-none"
            placeholder="Say something nice...   (/help for commands)"
          />
          <button
            onClick={() => {/* call your send() */}}
            className="px-4 py-2 rounded-lg bg-emerald-500/90 text-white hover:bg-emerald-500"
          >
            Send
          </button>
        </div>
      </div>

      {/* Toast + Help overlays stay as you already had them */}
    </div>
  );
}
