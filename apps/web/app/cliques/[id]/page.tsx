"use client";
import { useTheme } from "../../theme-context";
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import Chat from "../Chat";
import dynamic from "next/dynamic";
import { supabaseBrowser } from "@/lib/supabase/client";

// Dynamically import CliqueUserList as a client component
const CliqueUserList = dynamic(() => import("./CliqueUserList"), { ssr: false });

export default function CliquePage({ params }: { params: { id: string } }) {
  const { accent } = useTheme();
  const [clique, setClique] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();
        // Fetch clique by ID
        const { data: cliqueData, error: cliqueError } = await supabase
          .from("cliques")
          .select("id, name, slug, description, is_private, owner_id, created_at")
          .eq("id", params.id)
          .single();

        if (cliqueError || !cliqueData) {
          setError("Clique not found.");
          return;
        }
        setClique(cliqueData);

        // 1) pull members (id + role)
        const { data: cm } = await supabase
          .from("clique_members")
          .select("user_id, role")
          .eq("clique_id", params.id);

        const userIds = (cm ?? []).map((m: any) => m.user_id);
        // 2) pull profiles in bulk
        const { data: profs } = userIds.length
          ? await supabase
              .from("profiles")
              .select("user_id, handle, display_name, avatar_url")
              .in("user_id", userIds)
          : { data: [] as any[] };

        // 3) merge + sort (owner → moderator → member → alpha)
        const rank = (r?: string) => (r === "owner" ? 0 : r === "moderator" ? 1 : 2);
        const mergedMembers = (cm ?? [])
          .map((m: any) => ({
            user_id: m.user_id,
            role: m.role ?? "member",
            ...(profs?.find((p: any) => p.user_id === m.user_id) ?? { handle: null, display_name: null, avatar_url: null })
          }))
          .sort((a: any, b: any) => rank(a.role) - rank(b.role) || (a.display_name ?? a.handle ?? "").localeCompare(b.display_name ?? b.handle ?? ""));
        setMembers(mergedMembers);
      } catch {
        setError("Failed to load clique.");
      }
    })();
  }, [params.id]);

  if (error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen md:ml-64">
          <Topbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="p-8 text-gray-300">{error}</div>
          </main>
        </div>
      </div>
    );
  }

  if (!clique) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen md:ml-64">
          <Topbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="p-8 text-gray-300">Loading…</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 flex flex-col px-4">
          {/* Title and description */}
          <div className="w-full max-w-2xl">
            <h1
              className="text-4xl font-extrabold mb-2"
              style={{ color: `var(--tw-color-accent-${accent})` }}
            >
              {clique.name}
            </h1>
            {clique.description && (
              <p className="text-gray-300 text-lg mb-6">{clique.description}</p>
            )}
            <div className="mb-8 text-xs text-gray-500">
              Created: {new Date(clique.created_at).toLocaleString()}
            </div>
          </div>
          {/* Chat and members list side by side */}
          <div className="flex flex-row gap-8 w-full max-w-6xl">
            <div className="flex-1">
              <Chat cliqueId={clique.id} />
            </div>
            <div className="flex-shrink-0 flex flex-col justify-start">
              <CliqueUserList members={members} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}