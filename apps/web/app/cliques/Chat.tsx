"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ChevronRight } from "lucide-react";
import { useCliqueMembers } from "./[id]/CliqueMembersContext";
import SystemMessage from "./SystemMessage";
import UserMessage from "./UserMessage";
import RoleName from "./RoleName";

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
  const { members, updateMember } = useCliqueMembers();

  // Build memberRoles map for fast lookup
  const memberRoles = members.reduce((acc, m) => {
    acc[m.user_id] = { role: m.role, voice: !!m.voice };
    return acc;
  }, {} as Record<string, { role: string, voice: boolean }>);

  // Fetch clique settings and current user info
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
      // Fetch current user
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
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
      mounted = false;
    };
    // eslint-disable-next-line
  }, [cliqueId, supabase, members]);

  // Fetch messages and author profiles
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
    const me = members.find(m => m.user_id === user.id);
    return { user, role: me?.role ?? null, voice: !!me?.voice };
  }

  // Helper: get user_id by handle (case-insensitive, strip leading @)
  async function getUserIdByHandle(handle: string) {
    const clean = handle.replace(/^@/, "");
    const { data } = await supabase
      .from("profiles")
      .select("user_id, handle")
      .ilike("handle", clean)
      .single();
    return data?.user_id ?? null;
  }

  // Helper: get handle by user_id
  function getHandleByUserId(userId: string) {
    const member = members.find(m => m.user_id === userId);
    return member?.handle || member?.display_name || "unknown";
  }

  // Command parser and executor (restored)
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
      if (topicLocked && !["owner", "mod"].includes(role ?? "")) {
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
        // Insert system message
        await supabase.from("messages").insert({
          clique_id: cliqueId,
          author_id: user.id,
          body: `[System] Topic changed to: "${newTopic}" by @${getHandleByUserId(user.id)}`,
          is_system: true,
          system_type: "topic_change",
        });
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
      if (!["owner", "mod"].includes(role ?? "")) {
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
        // Insert system message
        await supabase.from("messages").insert({
          clique_id: cliqueId,
          author_id: user.id,
          body: `[System] Topic lock ${lock ? "enabled" : "disabled"} by @${getHandleByUserId(user.id)}`,
          is_system: true,
          system_type: "mode_change",
        });
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
      if (!["owner", "mod"].includes(role ?? "")) {
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
        // Insert system message
        await supabase.from("messages").insert({
          clique_id: cliqueId,
          author_id: user.id,
          body: `[System] Moderated mode ${mod ? "enabled" : "disabled"} by @${getHandleByUserId(user.id)}`,
          is_system: true,
          system_type: "mode_change",
        });
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
      if (["+o", "-o"].includes(mode) && (role ?? "") !== "owner") {
        setToast("Only the owner can promote/demote another owner.");
        return;
      }
      // Only owner/mod can set other modes
      if (!["owner", "mod"].includes(role ?? "") && !["+o", "-o"].includes(mode)) {
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
      const targetMember = members.find(m => m.user_id === targetUserId);
      if (!targetMember) {
        setToast("User is not a member of this clique.");
        return;
      }
      // Handle modes
      if (mode === "+m") {
        if (targetMember.role === "mod") {
          setToast("User is already a moderator.");
          return;
        }
        // Optimistic update
        updateMember(targetUserId, { role: "mod" });
        const { error } = await supabase
          .from("clique_members")
          .update({ role: "mod" })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        if (!error) {
          setToast("User promoted to moderator.");
          await supabase.from("messages").insert({
            clique_id: cliqueId,
            author_id: user.id,
            body: `[System] @${getHandleByUserId(targetUserId)} was promoted to moderator by @${getHandleByUserId(user.id)}`,
            is_system: true,
            system_type: "mode_change",
          });
        } else {
          setToast("Failed to promote to moderator.");
        }
        return;
      }
      if (mode === "-m") {
        if (targetMember.role !== "mod") {
          setToast("User is not a moderator.");
          return;
        }
        updateMember(targetUserId, { role: "member" });
        const { error } = await supabase
          .from("clique_members")
          .update({ role: "member" })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        if (!error) {
          setToast("User demoted from moderator.");
          await supabase.from("messages").insert({
            clique_id: cliqueId,
            author_id: user.id,
            body: `[System] @${getHandleByUserId(targetUserId)} was demoted from moderator by @${getHandleByUserId(user.id)}`,
            is_system: true,
            system_type: "mode_change",
          });
        } else {
          setToast("Failed to demote moderator.");
        }
        return;
      }
      if (mode === "+v") {
        if (targetMember.voice) {
          setToast("User already has voice.");
          return;
        }
        updateMember(targetUserId, { voice: true });
        const { error } = await supabase
          .from("clique_members")
          .update({ voice: true })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        if (!error) {
          setToast("User given voice (+v).");
          await supabase.from("messages").insert({
            clique_id: cliqueId,
            author_id: user.id,
            body: `[System] @${getHandleByUserId(targetUserId)} was given voice by @${getHandleByUserId(user.id)}`,
            is_system: true,
            system_type: "mode_change",
          });
        } else {
          setToast("Failed to give voice.");
        }
        return;
      }
      if (mode === "-v") {
        if (!targetMember.voice) {
          setToast("User does not have voice.");
          return;
        }
        updateMember(targetUserId, { voice: false });
        const { error } = await supabase
          .from("clique_members")
          .update({ voice: false })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        if (!error) {
          setToast("User voice removed (-v).");
          await supabase.from("messages").insert({
            clique_id: cliqueId,
            author_id: user.id,
            body: `[System] @${getHandleByUserId(targetUserId)} had voice removed by @${getHandleByUserId(user.id)}`,
            is_system: true,
            system_type: "mode_change",
          });
        } else {
          setToast("Failed to remove voice.");
        }
        return;
      }
      if (mode === "+o") {
        // Promote user to owner, demote current owner to member
        updateMember(targetUserId, { role: "owner" });
        const { data: { user: me } } = await supabase.auth.getUser();
        if (me) updateMember(me.id, { role: "member" });
        await supabase
          .from("clique_members")
          .update({ role: "owner" })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        if (me) {
          await supabase
            .from("clique_members")
            .update({ role: "member" })
            .eq("clique_id", cliqueId)
            .eq("user_id", me.id);
        }
        await supabase
          .from("cliques")
          .update({ owner_id: targetUserId })
          .eq("id", cliqueId);
        setToast("Ownership transferred.");
        await supabase.from("messages").insert({
          clique_id: cliqueId,
          author_id: user.id,
          body: `[System] Ownership transferred to @${getHandleByUserId(targetUserId)} by @${getHandleByUserId(user.id)}`,
          is_system: true,
          system_type: "mode_change",
        });
        return;
      }
      if (mode === "-o") {
        if (targetMember.role !== "owner") {
          setToast("User is not an owner.");
          return;
        }
        updateMember(targetUserId, { role: "member" });
        await supabase
          .from("clique_members")
          .update({ role: "member" })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        setToast("User demoted from owner.");
        await supabase.from("messages").insert({
          clique_id: cliqueId,
          author_id: user.id,
          body: `[System] @${getHandleByUserId(targetUserId)} was demoted from owner by @${getHandleByUserId(user.id)}`,
          is_system: true,
          system_type: "mode_change",
        });
        return;
      }
      setToast("Unknown mode.");
      return;
    }

    // /kick @user
    if (cmd.startsWith("/kick ")) {
      const handle = cmd.replace("/kick", "").trim();
      const { user, role } = await getCurrentUserAndRole();
      if (!user) {
        setToast("You must be signed in.");
        return;
      }
      if (!["owner", "mod"].includes(role ?? "")) {
        setToast("Only owners or moderators can kick.");
        return;
      }
      const targetUserId = await getUserIdByHandle(handle);
      if (!targetUserId) {
        setToast(`No user with handle ${handle} found.`);
        return;
      }
      if (user.id === targetUserId) {
        setToast("You cannot kick yourself.");
        return;
      }
      // Remove from clique_members
      const { error } = await supabase
        .from("clique_members")
        .delete()
        .eq("clique_id", cliqueId)
        .eq("user_id", targetUserId);
      if (!error) {
        setToast("User kicked.");
        await supabase.from("messages").insert({
          clique_id: cliqueId,
          author_id: user.id,
          body: `[System] @${getHandleByUserId(targetUserId)} was kicked by @${getHandleByUserId(user.id)}`,
          is_system: true,
          system_type: "kick",
        });
      } else {
        setToast("Failed to kick user.");
      }
      return;
    }

    // /ban @user
    if (cmd.startsWith("/ban ")) {
      const handle = cmd.replace("/ban", "").trim();
      const { user, role } = await getCurrentUserAndRole();
      if (!user) {
        setToast("You must be signed in.");
        return;
      }
      if (!["owner", "mod"].includes(role ?? "")) {
        setToast("Only owners or moderators can ban.");
        return;
      }
      const targetUserId = await getUserIdByHandle(handle);
      if (!targetUserId) {
        setToast(`No user with handle ${handle} found.`);
        return;
      }
      if (user.id === targetUserId) {
        setToast("You cannot ban yourself.");
        return;
      }
      // Add to clique_bans and remove from clique_members
      await supabase.from("clique_bans").insert({
        clique_id: cliqueId,
        user_id: targetUserId,
        banned_by: user.id,
        reason: "Banned via chat command",
      });
      await supabase
        .from("clique_members")
        .delete()
        .eq("clique_id", cliqueId)
        .eq("user_id", targetUserId);
      setToast("User banned.");
      await supabase.from("messages").insert({
        clique_id: cliqueId,
        author_id: user.id,
        body: `[System] @${getHandleByUserId(targetUserId)} was banned by @${getHandleByUserId(user.id)}`,
        is_system: true,
        system_type: "ban",
      });
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
          msgs.map(m =>
            m.is_system ? (
              <SystemMessage key={m.id} body={m.body} />
            ) : (
              <UserMessage key={m.id} msg={m} cliqueId={cliqueId} memberRoles={memberRoles} />
            )
          )
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