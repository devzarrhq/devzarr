"use client";
import { useState } from "react";
import { Users } from "lucide-react";
import Link from "next/link";
import { useCliqueMembership } from "./useCliqueMembership";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "../providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useTheme } from "../theme-context";

type Clique = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export default function CliquesSearch({
  cliques,
  memberCounts,
}: {
  cliques: Clique[];
  memberCounts: Record<string, number>;
}) {
  const { accent } = useTheme();
  const [query, setQuery] = useState("");
  const filtered = cliques.filter(
    (c) =>
      c.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.slug?.toLowerCase().includes(query.toLowerCase()) ||
      c.description?.toLowerCase().includes(query.toLowerCase())
  );
  const { user } = useAuth();
  const router = useRouter();

  async function handleJoin(cliqueId: string) {
    if (!user) {
      alert("Sign in to join cliques.");
      return;
    }
    const supabase = supabaseBrowser();
    await supabase.from("clique_members").insert({
      clique_id: cliqueId,
      user_id: user.id,
      role: "member",
    });
    router.refresh();
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search cliques…"
        className="w-full mb-6 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
        style={{ ["--tw-ring-color" as any]: `var(--tw-color-accent-${accent})` }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-gray-400">No cliques found.</div>
        ) : (
          filtered.map((c) => {
            const isMember = useCliqueMembership(c.id);
            return (
              <div
                key={c.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-gray-800 transition"
              >
                <Link
                  href={`/cliques/${c.id}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <Users className="w-8 h-8" style={{ color: `var(--tw-color-accent-${accent})` }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-white truncate">{c.name}</div>
                    <div className="text-gray-400 text-sm truncate">{c.description || c.slug}</div>
                  </div>
                  <div className="text-gray-300 text-sm">
                    {memberCounts[c.id] ?? 0} member{(memberCounts[c.id] ?? 0) === 1 ? "" : "s"}
                  </div>
                </Link>
                {isMember === false && (
                  <button
                    className="ml-4 px-4 py-1.5 rounded-lg text-white font-semibold text-sm hover:opacity-90"
                    style={{ background: `var(--tw-color-accent-${accent})` }}
                    onClick={() => handleJoin(c.id)}
                  >
                    Join
                  </button>
                )}
                {isMember === true && (
                  <span className="ml-4 px-4 py-1.5 rounded-lg bg-white/10 text-white font-semibold text-sm">
                    Member
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}