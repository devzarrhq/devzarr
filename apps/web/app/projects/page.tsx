import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import RightSidebarWidgets from "../components/RightSidebarWidgets";
import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { Rocket, Users } from "lucide-react";
import ProjectsSortDropdown from "../components/ProjectsSortDropdown";

export const dynamic = "force-dynamic";

type Project = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  cover_url: string | null;
  created_at: string;
};

type FollowersMap = Record<string, number>;

function sortProjects(
  projects: Project[],
  sort: string,
  followersMap: FollowersMap
): Project[] {
  if (sort === "az") {
    return [...projects].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }
  if (sort === "popular") {
    return [...projects].sort(
      (a, b) => (followersMap[b.id] || 0) - (followersMap[a.id] || 0)
    );
  }
  // Default: most recent
  return [...projects].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export default async function ProjectsPage({ searchParams }: { searchParams?: { sort?: string } }) {
  const supabase = createSupabaseServer();

  // Fetch all public projects
  const { data: projects, error: projectsError } = await supabase
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
  const sortedProjects = sortProjects(safeProjects, sort, followersMap);

  return (
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <div className="flex flex-1 flex-row">
          <div className="flex-1 flex flex-col md:ml-64 lg:mr-[340px]">
            <main className="w-full py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-accent">
                    Projects
                  </h1>
                  <p className="text-gray-300 text-lg max-w-2xl mt-1">
                    Discover indie dev tools and open projects.
                  </p>
                </div>
                {/* Sort dropdown */}
                <ProjectsSortDropdown sort={sort} />
              </div>
              {/* Projects grid */}
              {sortedProjects.length === 0 ? (
                <div className="text-gray-400 text-center py-16">
                  No projects found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                  {sortedProjects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.slug}`}
                      className="group block rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 p-6 shadow-lg w-full transition hover:ring-2 hover:ring-emerald-400/60 focus:outline-none"
                      tabIndex={0}
                      aria-label={`View project ${p.name}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {p.cover_url ? (
                          <img
                            src={p.cover_url}
                            alt={p.name}
                            className="h-10 w-10 rounded object-cover border border-gray-700"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-700 flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-emerald-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate group-hover:underline">
                            {p.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(p.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Users className="w-4 h-4 text-emerald-300" />
                          {followersMap[p.id] || 0}
                        </div>
                      </div>
                      <div className="text-gray-300 text-sm line-clamp-3">
                        {p.summary || "No summary yet."}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
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