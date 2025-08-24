"use client";
import { useState } from "react";
import { Users } from "lucide-react";
import Link from "next/link";

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
  const [query, setQuery] = useState("");
  const filtered = cliques.filter(
    (c) =>
      c.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.slug?.toLowerCase().includes(query.toLowerCase()) ||
      c.description?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search cliques…"
        className="w-full mb-6 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-gray-400">No cliques found.</div>
        ) : (
          filtered.map((c) => (
            <Link
              key={c.id}
              href={`/cliques/${c.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-emerald-900/10 border border-gray-800 transition"
            >
              <Users className="w-8 h-8 text-emerald-300" />
              <div className="flex-1">
                <div className="font-semibold text-lg text-white">{c.name}</div>
                <div className="text-gray-400 text-sm">{c.description || c.slug}</div>
              </div>
              <div className="text-gray-300 text-sm">
                {memberCounts[c.id] ?? 0} member{(memberCounts[c.id] ?? 0) === 1 ? "" : "s"}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}