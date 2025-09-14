"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ChevronRight } from "lucide-react";
import { useCliqueMembers } from "./[id]/CliqueMembersContext";

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
  author_id?: string;
  created_at: string;
  type?: string; // can be "system" or undefined
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserVoice, setCurrentUserVoice] = useState<boolean>(false);
  const scroller = useRef<HTMLDivElement>(null);

  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteOptions, setAutocompleteOptions] = useState(HELP_COMMANDS);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);

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
        .select("id, body, author_id, created_at, type")
        .eq("clique_id", cliqueId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (!messages || messages.length === 0) {
        setMsgs([]);
        return;
      }
      // Get unique author_ids for user messages (type !== "system" or missing)
      const authorIds = Array.from(new Set(messages.filter((m: any) => !m.type || m.type !== "system").map((m: any) => m.author_id))).filter(Boolean);
      // Fetch all profiles for these authors
      let profiles: any[] = [];
      if (authorIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, handle, display_name, avatar_url")
          .in("user_id", authorIds);
        profiles = profs ?? [];
      }
      // Map profiles to messages
      const profileMap: Record<string, any> = {};
      (profiles ?? []).forEach((p: any) => {
        profileMap[p.user_id] = p;
      });
      // Defensive: treat as system message only if type === "system"
      const mapped = messages.map((m: any) => ({
        ...m,
        type: m.type === "system" ? "system" : undefined,
        author: m.type === "system" ? null : (profileMap[m.author_id] || null),
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
          let author = null;
          if (!m.type || m.type !== "system") {
            const { data: a } = await supabase
              .from("profiles")
              .select("handle, display_name, avatar_url")
              .eq("user_id", m.author_id)
              .single();
            author = a || null;
          }
          setMsgs((prev) => [
            ...prev,
            { ...m, type: m.type === "system" ? "system" : undefined, author },
          ]);
          setTimeout(() => {
            scroller.current?.scrollTo(0, scroller.current.scrollHeight);
          }, 100);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [cliqueId, supabase]);

  // ... rest of the file is unchanged ...
  // (no changes needed below this point)
  // [The rest of the file remains as in the previous version]