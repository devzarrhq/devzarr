"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ChevronRight } from "lucide-react";

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

export default function Chat({ cliqueId, topic }: { cliqueId: string, topic?: string }) {
  const supabase = supabaseBrowser();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(topic || "");
  const [topicLocked, setTopicLocked] = useState(false);
  const [moderated, setModerated] = useState(false);
  const [memberRoles, setMemberRoles] = useState<Record<string, { role: string, voice: boolean }>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserVoice, setCurrentUserVoice] = useState<boolean>(false);
  const scroller = useRef<HTMLDivElement>(null);

  // Fetch clique settings and member roles
  async function refreshMemberRoles() {
    const { data: members } = await supabase
      .from("clique_members")
      .select("user_id, role, voice")
      .eq("clique_id", cliqueId);
    const map: Record<string, { role: string, voice: boolean }> = {};
    (members ?? []).forEach((m: any) => {
      map[m.user_id] = { role: m.role, voice: !!m.voice };
    });
    setMemberRoles(map);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Fetch clique settings
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
      // Fetch all member roles and voice
      await refreshMemberRoles();
      // Fetch current user
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted) setCurrentUserId(user?.id ?? null);
      if (user) {
        const { data: member } = await supabase
          .from("clique_members")
          .select("role, voice")
          .eq("clique_id", cliqueId)
          .eq("user_id", user.id)
          .single();
        if (mounted && member) {
          setCurrentUserRole(member.role);
          setCurrentUserVoice(!!member.voice);
        }
      }
    })();
    // Listen for changes to clique settings
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
      .on("postgres_changes",
        { event: "*", schema: "public", table: "clique_members", filter: `clique_id=eq.${cliqueId}` },
        async () => {
          await refreshMemberRoles();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
      mounted = false;
    };
    // eslint-disable-next-line
  }, [cliqueId, supabase]);

  // Fetch messages and author profiles
  useEffect(() => {
    (async () => {
      const { data: messages } = await supabase
        .from("messages")
        .select("id, body, author_id, created_at")
        .eq("clique_id", cliqueId)
        .order("created_at", { ascending: true })
        .limit(100);
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

  // Helper: get current user and their role/voice in this clique
  async function getCurrentUserAndRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, role: null, voice: false };
    const { data: member } = await supabase
      .from("clique_members")
      .select("role, voice")
      .eq("clique_id", cliqueId)
      .eq("user_id", user.id)
      .single();
    return { user, role: member?.role ?? null, voice: !!member?.voice };
  }

  // Helper: get user_id by handle (case-insensitive, strip leading @)
  async function getUserIdByHandle(handle: string) {
    const clean = handle.replace(/^@/, "");
    const { data } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("handle", clean)
      .single();
    return data?.user_id ?? null;
  }

  // Manual member list refresh: trigger a custom event
  function forceMemberListRefresh() {
    window.dispatchEvent(new CustomEvent("clique-members-refresh"));
    refreshMemberRoles();
  }

  // Command parser and executor
  async function handleCommand(cmd: string) {
    // /help
    if (cmd.trim() === "/help") {
      setToast("Type /mode @user +v to give voice, +m to make moderator, etc.");
      setShowHelp(true);
      return;
    }

    // /topic <new topic>
    if (cmd.startsWith("/topic ")) {
      const newTopic = cmd.replace("/topic", "").trim();
      const { user, role } = await getCurrentUserAndRole();
      if (!user) {
        setToast("You must be signed in.");
        return;
      }
      if (topicLocked && !["owner", "moderator"].includes(role)) {
        setToast("Only owners or moderators can change the topic.");
        return;
      }
      // Update topic in DB
      const { error } = await supabase
        .from("cliques")
        .update({ topic: newTopic })
        .eq("id", cliqueId);
      if (!error) {
        setCurrentTopic(newTopic);
        setToast("Topic updated.");
      } else {
        setToast("Failed to update topic.");
      }
      return;
    }

    // /mode +t or /mode -t
    if (cmd.trim() === "/mode +t" || cmd.trim() === "/mode -t") {
      const { user, role } = await getCurrentUserAndRole();
      if (!user) {
        setToast("You must be signed in.");
        return;
      }
      if (!["owner", "moderator"].includes(role)) {
        setToast("Only owners or moderators can change topic lock.");
        return;
      }
      const lock = cmd.trim() === "/mode +t";
      const { error } = await supabase
        .from("cliques")
        .update({ topic_locked: lock })
        .eq("id", cliqueId);
      if (!error) {
        setTopicLocked(lock);
        setToast(lock ? "Topic lock enabled (+t)." : "Topic lock disabled (-t).");
      } else {
        setToast("Failed to update topic lock.");
      }
      return;
    }

    // /mode +m or /mode -m (moderated chat)
    if (cmd.trim() === "/mode +m" || cmd.trim() === "/mode -m") {
      const { user, role } = await getCurrentUserAndRole();
      if (!user) {
        setToast("You must be signed in.");
        return;
      }
      if (!["owner", "moderator"].includes(role)) {
        setToast("Only owners or moderators can change moderated mode.");
        return;
      }
      const mod = cmd.trim() === "/mode +m";
      const { error } = await supabase
        .from("cliques")
        .update({ moderated: mod })
        .eq("id", cliqueId);
      if (!error) {
        setModerated(mod);
        setToast(mod ? "Moderated mode enabled (+m)." : "Moderated mode disabled (-m).");
      } else {
        setToast("Failed to update moderated mode.");
      }
      return;
    }

    // /mode @user +m/-m/+v/-v/+o/-o
    if (cmd.startsWith("/mode ")) {
      const parts = cmd.split(" ");
      if (parts.length < 3) {
        setToast("Usage: /mode @user +v|-v|+m|-m|+o|-o");
        return;
      }
      const handle = parts[1];
      const mode = parts[2];
      const { user, role } = await getCurrentUserAndRole();
      if (!user) {
        setToast("You must be signed in.");
        return;
      }
      // Only owner can transfer ownership
      if (["+o", "-o"].includes(mode) && role !== "owner") {
        setToast("Only the owner can promote/demote another owner.");
        return;
      }
      // Only owner/mod can set other modes
      if (!["owner", "moderator"].includes(role) && !["+o", "-o"].includes(mode)) {
        setToast("Only owners or moderators can change modes.");
        return;
      }
      const targetUserId = await getUserIdByHandle(handle);
      if (!targetUserId) {
        setToast(`No user with handle ${handle} found.`);
        return;
      }
      if (user.id === targetUserId) {
        setToast("You cannot perform this action on yourself.");
        return;
      }
      // Get target's current role/voice
      const { data: targetMember, error: targetError } = await supabase
        .from("clique_members")
        .select("role, voice")
        .eq("clique_id", cliqueId)
        .eq("user_id", targetUserId)
        .single();
      if (targetError || !targetMember) {
        setToast("User is not a member of this clique.");
        return;
      }
      // Handle modes
      if (mode === "+m") {
        if (targetMember.role === "moderator") {
          setToast("User is already a moderator.");
          return;
        }
        const { error } = await supabase
          .from("clique_members")
          .update({ role: "moderator" })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        if (error) {
          setToast("Failed to promote to moderator.");
        } else {
          setToast("User promoted to moderator.");
          forceMemberListRefresh();
        }
        return;
      }
      if (mode === "-m") {
        if (targetMember.role !== "moderator") {
          setToast("User is not a moderator.");
          return;
        }
        const { error } = await supabase
          .from("clique_members")
          .update({ role: "member" })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        if (error) {
          setToast("Failed to demote moderator.");
        } else {
          setToast("User demoted from moderator.");
          forceMemberListRefresh();
        }
        return;
      }
      if (mode === "+v") {
        if (targetMember.voice) {
          setToast("User already has voice.");
          return;
        }
        const { error } = await supabase
          .from("clique_members")
          .update({ voice: true })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        if (error) {
          setToast("Failed to give voice.");
        } else {
          setToast("User given voice (+v).");
          forceMemberListRefresh();
        }
        return;
      }
      if (mode === "-v") {
        if (!targetMember.voice) {
          setToast("User does not have voice.");
          return;
        }
        const { error } = await supabase
          .from("clique_members")
          .update({ voice: false })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        if (error) {
          setToast("Failed to remove voice.");
        } else {
          setToast("User voice removed (-v).");
          forceMemberListRefresh();
        }
        return;
      }
      if (mode === "+o") {
        // Promote user to owner, demote current owner to member
        await supabase
          .from("clique_members")
          .update({ role: "owner" })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        await supabase
          .from("clique_members")
          .update({ role: "member" })
          .eq("clique_id", cliqueId)
          .eq("user_id", user.id);
        // Update owner_id in cliques table
        await supabase
          .from("cliques")
          .update({ owner_id: targetUserId })
          .eq("id", cliqueId);
        setToast("Ownership transferred.");
        forceMemberListRefresh();
        return;
      }
      if (mode === "-o") {
        if (targetMember.role !== "owner") {
          setToast("User is not an owner.");
          return;
        }
        await supabase
          .from("clique_members")
          .update({ role: "member" })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        setToast("User demoted from owner.");
        forceMemberListRefresh();
        return;
      }
      setToast("Unknown mode.");
      return;
    }

    setToast("Unknown command.");
  }

  // Send message or handle command
  const send = async () => {
    if (!text.trim()) return;
    if (text.trim().startsWith("/")) {
      await handleCommand(text.trim());
      setText("");
      // Always show toast for feedback
      setTimeout(() => setToast(null), 2200);
      return;
    }
    // Moderated mode: only allow +o, +m, +v to talk
    if (moderated) {
      if (
        !(
          currentUserRole === "owner" ||
          currentUserRole === "moderator" ||
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
    });
    if (!error) setText("");
  };

  // Enter = send, Shift+Enter = newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    // Shift+Enter: allow newline (do nothing)
  };

  // Show default topic if none set
  const displayTopic = currentTopic?.trim() ? currentTopic : "Welcome to the clique";

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl bg-white/5 ring-1 ring-white/10">
      {/* Topic at the top */}
      <div className="px-4 py-2 bg-emerald-900/20 text-emerald-300 font-semibold text-center border-b border-emerald-700">
        Topic: {displayTopic}
        {topicLocked && <span className="ml-2 text-xs text-emerald-400">[+t]</span>}
        {moderated && <span className="ml-2 text-xs text-emerald-400">[+m]</span>}
      </div>
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
                  {/* Name with role/voice badge */}
                  <RoleName
                    userId={m.author_id}
                    cliqueId={cliqueId}
                    handle={m.author?.handle}
                    displayName={m.author?.display_name}
                    memberRoles={memberRoles}
                  />
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
          placeholder="Say something nice...   (/help for commands)"
          rows={2}
        />
        <button onClick={send} className="px-4 py-2 rounded-lg bg-emerald-500/90 text-white hover:bg-emerald-500">
          Send
        </button>
      </div>
      {/* Toast/snackbar */}
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-50">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg border border-emerald-400 font-semibold animate-fade-in-out" style={{ whiteSpace: "pre-line" }}>
            {toast}
          </div>
        </div>
      )}
      {/* Help Modal */}
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
      `}</style>
    </div>
  );
}

// Helper component to show role/voice badge before name
function RoleName({
  userId,
  cliqueId,
  handle,
  displayName,
  memberRoles,
}: {
  userId: string;
  cliqueId: string;
  handle?: string | null;
  displayName?: string | null;
  memberRoles: Record<string, { role: string, voice: boolean }>;
}) {
  // Use passed-in memberRoles for efficiency
  const info = memberRoles[userId] || { role: null, voice: false };
  let prefix = "";
  if (info.role === "owner") prefix = "@";
  else if (info.role === "moderator") prefix = "^";
  else if (info.voice) prefix = "+";
  return (
    <span className="font-semibold text-xs text-emerald-300">
      {prefix}
      {displayName || handle || "Anonymous"}
    </span>
  );
}