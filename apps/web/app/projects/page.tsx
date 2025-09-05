export const dynamic = "force-dynamic";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import RightSidebarWidgets from "../components/RightSidebarWidgets";
import { createSupabaseServer } from "@/lib/supabase/server";
import dynamicImport from "next/dynamic";

const ProjectsClient = dynamicImport(() => import("./ProjectsClient"), { ssr: false });

type Project = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  cover_url: string | null;
  created_at: string;
};

type FollowersMap = Record<string, number>;

export default async function ProjectsPage({ searchParams }: { searchParams?: { sort?: string } }) {
  const supabase = createSupabaseServer();

  // Fetch all public projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, slug, summary, cover_url, created_at")
    .eq("is_public", true);

  // Defensive: if projects is null, treat as empty array
  const safeProjects = Array.isArray(projects) ? projects : [];

  // Fetch follower counts for popularity sort
  let followersMap: FollowersMap = {};
  if (safeProjects.length > 0) {
    const ids = safeProjects.map((p) => p.id);
    const { data: follows } = await supabase
      .from("project_follows")
      .select("project_id");
    if (Array.isArray(follows)) {
      for (const id of ids) {
        followersMap[id] = follows.filter((f) => f.project_id === id).length;
      }
    }
  }

  const sort = searchParams?.sort || "recent";

  return (
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <div className="flex flex-1 flex-row">
          <div className="flex-1 flex flex-col md:ml-64 lg:mr-[340px]">
            <main className="w-full py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <ProjectsClient projects={safeProjects} followersMap={followersMap} sort={sort} />
            </main>
          </div>
          <aside className="hidden lg:block lg:w-[340px] flex-shrink-0 px-6 py-10 fixed right-0 top-0 h-full z-10">
            <RightSidebarWidgets />
          </aside>
        </div>
      </div>
    </div>
  );
}