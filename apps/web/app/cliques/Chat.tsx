"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ChevronRight } from "lucide-react";
import { useCliqueMembers } from "./[id]/CliqueMembersContext";
import SystemMessage from "./SystemMessage";
import UserMessage from "./UserMessage";
import RoleName from "./RoleName";

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
  {
    cmd: "/topic <new topic>",
    desc: "Set the channel topic (owner/mod only, if +t)",
  },
  {
    cmd: "/mode @user +m/-m/+v/-v/+o/-o",
    desc: "Promote/demote moderator, give/remove voice, or promote/demote owner (owner/mod only for +m/+v, owner only for +o)",
  },
  {
    cmd: "/mode +t/-t",
    desc: "Lock/unlock topic (only mods/ops can change topic)",
  },
  {
    cmd: "/mode +m/-m",
    desc: "Enable/disable moderated chat (only +v, +o, +m can talk)",
  },
  {
    cmd: "/kick @user",
    desc: "Remove a user from the clique (owner/mod only)",
  },
  {
    cmd: "/ban @user",
    desc: "Ban a user from the clique (owner/mod only)",
  },
  {
    cmd: "/help",
    desc: "Show this help popup",
  },
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

export default function Chat({ cliqueId, topic }: { cliqueId: string, topic?: string }) {
  const supabase = supabaseBrowser();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(topic || "");
  const [topicLocked, setTopicLocked] = useState(false);
  const [moderated, setModerated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserVoice, setCurrentUserVoice] = useState<boolean>(false);
  const scroller = useRef<HTMLDivElement>(null);

  // Use shared clique members context
  const { members } = useCliqueMembers();

  // Build memberRoles map for fast lookup
  const memberRoles = members.reduce((acc, m) => {
    acc[m.user_id] = { role: m.role, voice: !!m.voice };
    return acc;
  }, {} as Record<string, { role: string, voice: boolean }>);

  // Fetch clique settings and current user info
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: clique } = await supabase
        .from("cliques")
        .select("topic, topic_locked, moderated")
        .eq("id", cliqueId)
        .single();
      if (mounted && clique) {
        setCurrentTopic(clique.topic || "");
        setTopicLocked(!!clique.topic_locked);
        setModerated(!!clique.moderated);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted) setCurrentUserId(user?.id ?? null);
      if (user) {
        const me = members.find(m => m.user_id === user.id);
        if (me) {
          setCurrentUserRole(me.role);
          setCurrentUserVoice(!!me.voice);
        }
      }
    })();
    const ch = supabase
      .channel(`clique-settings:${cliqueId}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "cliques", filter: `id=eq.${cliqueId}` },
        payload => {
          if (payload.new) {
            setCurrentTopic(payload.new.topic || "");
            setTopicLocked(!!payload.new.topic_locked);
            setModerated(!!payload.new.moderated);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
      mounted = false;
    };
  }, [cliqueId, supabase, members]);

  useEffect(() => {
    (async () => {
      const { data: messages } = await supabase
        .from("messages")
        .select("id, body, author_id, created_at, is_system, system_type")
        .eq("clique_id", cliqueId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (!messages || messages.length === 0) {
        setMsgs([]);
        return;
      }
      const authorIds = Array.from(new Set(messages.map((m: any) => m.author_id))).filter(Boolean);
      if (authorIds.length === 0) {
        setMsgs(messages);
        return;
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, handle, display_name, avatar_url")
        .in("user_id", authorIds);
      const profileMap: Record<string, any> = {};
      (profiles ?? []).forEach((p: any) => {
        profileMap[p.user_id] = p;
      });
      const mapped = messages.map((m: any) => ({
        ...m,
        author: profileMap[m.author_id] || null,
      }));
      setMsgs(mapped);
    })();
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
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [cliqueId, supabase]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom || el.scrollTop === 0) {
      el.scrollTo({ top: el.scrollHeight + 100, behavior: "smooth" });
    }
  }, [msgs.length]);

  async function getCurrentUserAndRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, role: null, voice: false };
    const me = members.find(m => m.user_id === user.id);
    return { user, role: me?.role ?? null, voice: !!me?.voice };
  }

  async function getUserIdByHandle(handle: string) {
    const clean = handle.replace(/^@/, "");
    const { data } = await supabase
      .from("profiles")
      .select("user_id, handle")
      .ilike("handle", clean)
      .single();
    return data?.user_id ?? null;
  }

  function getHandleByUserId(userId: string) {
    const member = members.find(m => m.user_id === userId);
    return member?.handle || member?.display_name || "unknown";
  }

  async function handleCommand(cmd: string) {
    const { user, role, voice } = await getCurrentUserAndRole();
    if (!user) {
      setToast("You must be signed in.");
      return;
    }
    if (cmd === "/help") {
      setShowHelp(true);
      return;
    }
    if (cmd.startsWith("/topic")) {
      const newTopic = cmd.replace("/topic", "").trim();
      if (!newTopic) {
        setToast("Usage: /topic <new topic>");
        return;
      }
      if (topicLocked && role !== "owner" && role !== "mod") {
        setToast("Topic is locked. Only owner/mod can change it.");
        return;
      }
      if (role !== "owner" && role !== "mod") {
        setToast("Only owner or mod can set the topic.");
        return;
      }
      const { error } = await supabase
        .from("cliques")
        .update({ topic: newTopic })
        .eq("id", cliqueId);
      if (!error) {
        setCurrentTopic(newTopic);
        await supabase.from("messages").insert({
          clique_id: cliqueId,
          author_id: user.id,
          body: `Topic changed to: "${newTopic}"`,
          is_system: true,
          system_type: "topic",
        });
        setToast("Topic updated.");
      } else {
        setToast("Failed to update topic.");
      }
      return;
    }
    if (cmd.startsWith("/mode")) {
      const args = cmd.replace("/mode", "").trim().split(/\s+/);
      if (args.length === 1 && (args[0] === "+t" || args[0] === "-t")) {
        if (role !== "owner" && role !== "mod") {
          setToast("Only owner or mod can lock/unlock topic.");
          return;
        }
        const lock = args[0] === "+t";
        const { error } = await supabase
          .from("cliques")
          .update({ topic_locked: lock })
          .eq("id", cliqueId);
        if (!error) {
          setTopicLocked(lock);
          await supabase.from("messages").insert({
            clique_id: cliqueId,
            author_id: user.id,
            body: lock ? "Topic lock enabled (+t)" : "Topic lock disabled (-t)",
            is_system: true,
            system_type: "mode",
          });
          setToast(lock ? "Topic lock enabled." : "Topic lock disabled.");
        } else {
          setToast("Failed to update topic lock.");
        }
        return;
      }
      if (args.length === 1 && (args[0] === "+m" || args[0] === "-m")) {
        if (role !== "owner" && role !== "mod") {
          setToast("Only owner or mod can change moderated mode.");
          return;
        }
        const mod = args[0] === "+m";
        const { error } = await supabase
          .from("cliques")
          .update({ moderated: mod })
          .eq("id", cliqueId);
        if (!error) {
          setModerated(mod);
          await supabase.from("messages").insert({
            clique_id: cliqueId,
            author_id: user.id,
            body: mod ? "Moderated mode enabled (+m)" : "Moderated mode disabled (-m)",
            is_system: true,
            system_type: "mode",
          });
          setToast(mod ? "Moderated mode enabled." : "Moderated mode disabled.");
        } else {
          setToast("Failed to update moderated mode.");
        }
        return;
      }
      if (args.length === 2 && args[0].startsWith("@")) {
        const targetHandle = args[0];
        const mode = args[1];
        const targetId = await getUserIdByHandle(targetHandle);
        const targetName = targetHandle;
        if (!targetId) {
          setToast("User not found.");
          return;
        }
        if ((mode === "+o" || mode === "-o") && role !== "owner") {
          setToast("Only owner can promote/demote owner.");
          return;
        }
        if ((mode === "+m" || mode === "-m" || mode === "+v" || mode === "-v") && role !== "owner" && role !== "mod") {
          setToast("Only owner or mod can change roles.");
          return;
        }
        if (mode === "+m" || mode === "-m") {
          const newRole = mode === "+m" ? "mod" : "member";
          const { error } = await supabase
            .from("clique_members")
            .update({ role: newRole })
            .eq("clique_id", cliqueId)
            .eq("user_id", targetId);
          if (!error) {
            await supabase.from("messages").insert({
              clique_id: cliqueId,
              author_id: user.id,
              body: mode === "+m"
                ? `${targetName} was promoted to moderator (+m)`
                : `${targetName} was demoted to member (-m)`,
              is_system: true,
              system_type: "mode",
            });
            setToast(mode === "+m" ? "Promoted to mod." : "Demoted to member.");
          } else {
            setToast("Failed to update role.");
          }
          return;
        }
        if (mode === "+v" || mode === "-v") {
          const newVoice = mode === "+v";
          const { error } = await supabase
            .from("clique_members")
            .update({ voice: newVoice })
            .eq("clique_id", cliqueId)
            .eq("user_id", targetId);
          if (!error) {
            await supabase.from("messages").insert({
              clique_id: cliqueId,
              author_id: user.id,
              body: newVoice
                ? `${targetName} was granted voice (+v)`
                : `${targetName} had voice removed (-v)`,
              is_system: true,
              system_type: "mode",
            });
            setToast(newVoice ? "Voice granted." : "Voice removed.");
          } else {
            setToast("Failed to update voice.");
          }
          return;
        }
        if (mode === "+o" || mode === "-o") {
          if (mode === "+o") {
            const { error } = await supabase
              .from("cliques")
              .update({ owner_id: targetId })
              .eq("id", cliqueId);
            if (!error) {
              await supabase.from("messages").insert({
                clique_id: cliqueId,
                author_id: user.id,
                body: `${targetName} is now the owner (+o)`,
                is_system: true,
                system_type: "mode",
              });
              setToast("Ownership transferred.");
            } else {
              setToast("Failed to transfer ownership.");
            }
            return;
          }
          setToast("To demote owner, transfer ownership.");
          return;
        }
        setToast("Unknown mode command.");
        return;
      }
      setToast("Usage: /mode @user +m/-m/+v/-v/+o/-o or /mode +t/-t or /mode +m/-m");
      return;
    }
    if (cmd.startsWith("/kick")) {
      const targetHandle = cmd.replace("/kick", "").trim();
      if (!targetHandle.startsWith("@")) {
        setToast("Usage: /kick @user");
        return;
      }
      if (role !== "owner" && role !== "mod") {
        setToast("Only owner or mod can kick.");
        return;
      }
      const targetId = await getUserIdByHandle(targetHandle);
      if (!targetId) {
        setToast("User not found.");
        return;
      }
      const { error } = await supabase
        .from("clique_members")
        .delete()
        .eq("clique_id", cliqueId)
        .eq("user_id", targetId);
      if (!error) {
        await supabase.from("messages").insert({
          clique_id: cliqueId,
          author_id: user.id,
          body: `${targetHandle} was kicked from the clique.`,
          is_system: true,
          system_type: "kick",
        });
        setToast("User kicked.");
      } else {
        setToast("Failed to kick user.");
      }
      return;
    }
    if (cmd.startsWith("/ban")) {
      const targetHandle = cmd.replace("/ban", "").trim();
      if (!targetHandle.startsWith("@")) {
        setToast("Usage: /ban @user");
        return;
      }
      if (role !== "owner" && role !== "mod") {
        setToast("Only owner or mod can ban.");
        return;
      }
      const targetId = await getUserIdByHandle(targetHandle);
      if (!targetId) {
        setToast("User not found.");
        return;
      }
      const { error } = await supabase
        .from("clique_bans")
        .insert({
          clique_id: cliqueId,
          user_id: targetId,
          banned_by: user.id,
        });
      if (!error) {
        await supabase
          .from("clique_members")
          .delete()
          .eq("clique_id", cliqueId)
          .eq("user_id", targetId);
        await supabase.from("messages").insert({
          clique_id: cliqueId,
          author_id: user.id,
          body: `${targetHandle} was banned from the clique.`,
          is_system: true,
          system_type: "ban",
        });
        setToast("User banned.");
      } else {
        setToast("Failed to ban user.");
      }
      return;
    }
    setToast("Unknown command. Type /help for a list of commands.");
  }

  const send = async () => {
    if (!text.trim()) return;
    if (text.trim().startsWith("/")) {
      await handleCommand(text.trim());
      setText("");
      setTimeout(() => setToast(null), 2200);
      return;
    }
    if (moderated) {
      if (
        !(
          currentUserRole === "owner" ||
          currentUserRole === "mod" ||
          currentUserVoice
        )
      ) {
        setToast("This clique is moderated. Only +o, +m, or +v can talk.");
        setTimeout(() => setToast(null), 2200);
        return;
      }
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Sign in first");
    const { error } = await supabase.from("messages").insert({
      clique_id: cliqueId,
      author_id: user.id,
      body: text.trim(),
      is_system: false,
      system_type: null,
    });
    if (!error) setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  let modeString = "";
  if (topicLocked) modeString += "t";
  if (moderated) modeString += "m";
  const displayModes = modeString ? `[+${modeString}]` : "";

  const displayTopic = currentTopic?.trim() ? currentTopic : "Welcome to the clique";

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden">
      <div className="px-4 py-2 bg-emerald-900/20 text-emerald-300 font-semibold text-center border-b border-emerald-700 flex items-center justify-center gap-2 rounded-t-2xl">
        <span>Topic: {displayTopic}</span>
        {displayModes && (
          <span className="ml-2 text-xs text-emerald-400 font-mono">{displayModes}</span>
        )}
      </div>
      {/* Scrollable message box with fade at top */}
      <div
        ref={scroller}
        className="flex-1 overflow-y-auto px-2 py-4 scroll-smooth custom-scrollbar pb-[260px]"
        style={{
          height: "400px",
          // maskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 100%)",
          // WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 100%)",
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
                <UserMessage key={m.id} msg={m} cliqueId={cliqueId} memberRoles={memberRoles} timeAgo={timeAgo} />
              )
            )
          )}
        </div>
      </div>
      <div className="absolute left-0 right-0 bottom-[200px] z-10 p-3 flex gap-2 border-t border-white/10 bg-gray-900/80 backdrop-blur rounded-t-2xl">
        <textarea
          value={text}
          onChange={(e)=>setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="flex-1 rounded-lg bg-gray-800 text-white px-3 py-2 ring-1 ring-white/10 resize-none"
          placeholder="Say something nice...   (/help for commands)"
        />
        <button
          onClick={send}
          className="px-4 py-2 rounded-lg bg-emerald-500/90 text-white hover:bg-emerald-500"
        >
          Send
        </button>
      </div>
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-50">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg border border-emerald-400 font-semibold animate-fade-in-out" style={{ whiteSpace: "pre-line" }}>
            {toast}
          </div>
        </div>
      )}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className="bg-gray-900 rounded-2xl shadow-2xl p-6 border border-emerald-400 flex flex-col items-center"
            style={{
              width: "100%",
              maxWidth: 420,
              minWidth: 0,
              margin: "0 auto",
            }}
          >
            <h2 className="text-lg font-bold mb-3 text-emerald-300 text-center">Clique Chat Commands</h2>
            <div className="w-full">
              <div className="font-semibold text-gray-100 mb-2">Available Commands:</div>
              <ul className="space-y-2 mb-6">
                {HELP_COMMANDS.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5">
                      <ChevronRight className="w-4 h-4 text-emerald-300" />
                    </span>
                    <span>
                      <span className="text-emerald-300 font-mono font-semibold">{c.cmd}</span>
                      <span className="text-gray-400"> — {c.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="mt-0 px-4 py-2 rounded bg-emerald-500/90 text-white font-semibold"
              onClick={() => setShowHelp(false)}
              autoFocus
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
          animation: fade-in-out 2.2s both;
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