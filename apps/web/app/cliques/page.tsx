import { createSupabaseServer } from "@/lib/supabase/server";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import CliquesSearch from "./CliquesSearch";
import AddCliqueModal from "./AddCliqueModal";
import { useTheme } from "../theme-context";

export const dynamic = "force-dynamic";

export default async function CliquesPage() {
  const supabase = createSupabaseServer();

  // Fetch all cliques and member counts
  const { data: cliques } = await supabase
    .from("cliques")
    .select("id, name, slug, description")
    .order("created_at", { ascending: false });

  // Fetch member counts for each clique
  let memberCounts: Record<string, number> = {};
  if (cliques && cliques.length > 0) {
    const cliqueIds = cliques.map((c) => c.id);
    const { data: members } = await supabase
      .from("clique_members")
      .select("clique_id, user_id");
    if (members) {
      for (const c of cliqueIds) {
        memberCounts[c] = members.filter((m) => m.clique_id === c).length;
      }
    }
  }

  // Use accent color in client
  return (
    <CliquesPageClient cliques={cliques ?? []} memberCounts={memberCounts} />
  );
}

// Client wrapper for accent color
"use client";
import React from "react";
export function CliquesPageClient({ cliques, memberCounts }: { cliques: any[]; memberCounts: Record<string, number> }) {
  const { accent } = useTheme();
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Center column: Cliques */}
          <section className="w-full py-10">
            <div className="mx-auto w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 items-start mb-8">
                <h1
                  className="text-4xl md:text-5xl font-extrabold"
                  style={{ color: `var(--tw-color-accent-${accent})` }}
                >
                  Cliques
                </h1>
                <p className="text-gray-300 text-lg max-w-2xl">
                  Find and join real-time dev groups.
                </p>
                <AddCliqueModal />
              </div>
              <CliquesSearch cliques={cliques} memberCounts={memberCounts} />
            </div>
          </section>
          {/* Right column: reserved for widgets */}
          <aside className="hidden lg:block w-[340px] flex-shrink-0 px-6 py-10 sticky top-16">
            {/* Future: Featured Cliques, etc. */}
          </aside>
        </main>
      </div>
    </div>
  );
}