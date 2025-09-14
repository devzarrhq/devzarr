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

const HELP_TEXT = `
<b>Available Commands:</b>
/topic &lt;new topic&gt; — Set the channel topic (owner/mod only)<br/>
/mode @user +m/-m/+o — Promote/demote moderator or transfer ownership (owner/mod only)<br/>
/kick @user — Remove a user from the clique (owner/mod only)<br/>
/ban @user — Ban a user from the clique (owner/mod only)<br/>
/help — Show this help popup<br/>
`;

export default function Chat({ cliqueId, topic }: { cliqueId: string, topic?: string }) {
  const supabase = supabaseBrowser();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(topic || "");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentTopic(topic || "");
  }, [topic]);

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

  // Helper: get current user and their role in this clique
  async function getCurrentUserAndRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, role: null };
    const { data: member } = await supabase
      .from("clique_members")
      .select("role")
      .eq("clique_id", cliqueId)
      .eq("user_id", user.id)
      .single();
    return { user, role: member?.role ?? null };
  }

  // Helper: get user_id by handle (case-insensitive)
  async function getUserIdByHandle(handle: string) {
    const { data } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("handle", handle.replace(/^@/, ""))
      .single();
    return data?.user_id ?? null;
  }

  // Manual member list refresh: trigger a custom event
  function forceMemberListRefresh() {
    window.dispatchEvent(new CustomEvent("clique-members-refresh"));
  }

  // Command parser and executor
  async function handleCommand(cmd: string) {
    // /help
    if (cmd.trim() === "/help") {
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
      if (!["owner", "moderator"].includes(role)) {
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

    // /mode @handle +v/-v/+m/-m/+o/-o
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
        setToast("Only the owner can transfer ownership.");
        return;
      }
      // Only owner/mod can set other modes
      if (!["owner", "moderator"].includes(role)) {
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
      // Get target's current role
      const { data: targetMember } = await supabase
        .from("clique_members")
        .select("role")
        .eq("clique_id", cliqueId)
        .eq("user_id", targetUserId)
        .single();
      if (!targetMember) {
        setToast("User is not a member of this clique.");
        return;
      }
      // Handle modes
      if (mode === "+m") {
        if (targetMember.role === "moderator") {
          setToast("User is already a moderator.");
          return;
        }
        await supabase
          .from("clique_members")
          .update({ role: "moderator" })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        setToast("User promoted to moderator.");
        forceMemberListRefresh();
        return;
      }
      if (mode === "-m") {
        if (targetMember.role !== "moderator") {
          setToast("User is not a moderator.");
          return;
        }
        await supabase
          .from("clique_members")
          .update({ role: "member" })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        setToast("User demoted from moderator.");
        forceMemberListRefresh();
        return;
      }
      if (mode === "+o") {
        // Transfer ownership: set target to owner, current owner to member
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
        setToast("Cannot demote owner without transferring ownership.");
        return;
      }
      // Voice (+v/-v) - for future: you can implement a 'voice' field in clique_members
      setToast("Voice (+v/-v) is not implemented yet.");
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
      return;
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
                  {/* Name with role badge */}
                  <RoleName userId={m.author_id} cliqueId={cliqueId} handle={m.author?.handle} displayName={m.author?.display_name} />
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
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-emerald-400">
            <h2 className="text-xl font-bold mb-4 text-emerald-300">Clique Chat Commands</h2>
            <div className="text-gray-200 text-sm mb-4" dangerouslySetInnerHTML={{ __html: HELP_TEXT }} />
            <button
              className="mt-2 px-4 py-2 rounded bg-emerald-500/90 text-white font-semibold"
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
          animation: fade-in-out 2.2s both;
        }
      `}</style>
    </div>
  );
}

// Helper component to show role badge before name
function RoleName({ userId, cliqueId, handle, displayName }: { userId: string, cliqueId: string, handle?: string | null, displayName?: string | null }) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("clique_members")
        .select("role")
        .eq("clique_id", cliqueId)
        .eq("user_id", userId)
        .single();
      if (mounted) setRole(data?.role ?? null);
    })();
    return () => { mounted = false; };
  }, [userId, cliqueId]);

  let prefix = "";
  if (role === "owner") prefix = "@";
  else if (role === "moderator") prefix = "^";
  // else if (role === "voice") prefix = "+"; // for future

  return (
    <span className="font-semibold text-xs text-emerald-300">
      {prefix}
      {displayName || handle || "Anonymous"}
    </span>
  );
}