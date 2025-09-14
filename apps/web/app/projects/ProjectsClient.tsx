"use client";
import Link from "next/link";
import { Rocket, Users } from "lucide-react";
import ProjectsSortDropdown from "../components/ProjectsSortDropdown";
import { useTheme } from "../theme-context";

type Project = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  cover_url: string | null;
  icon_url?: string | null;
  created_at: string;
};

type FollowersMap = Record<string, number>;

type Props = {
  projects: Project[];
  followersMap: FollowersMap;
  sort: string;
};

// --- Relative time utility (copied from feed) ---
function timeAgo(date: string | Date) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr${Math.floor(diff / 3600) === 1 ? "" : "s"} ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? "" : "s"} ago`;
  return then.toLocaleDateString();
}

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

export default function ProjectsClient({ projects, followersMap, sort }: Props) {
  const { accent } = useTheme();
  const sortedProjects = sortProjects(projects, sort, followersMap);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-4xl md:text-5xl font-extrabold"
            style={{ color: `var(--tw-color-accent-${accent})` }}
          >
            Projects
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mt-1">
            Discover indie dev tools and open projects.
          </p>
        </div>
        <ProjectsSortDropdown sort={sort} />
      </div>
      {sortedProjects.length === 0 ? (
        <div className="text-gray-400 text-center py-16">
          No projects found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {sortedProjects.map((p) => {
            // Project icon/avatar: icon_url > cover_url > fallback
            let projectIcon = null;
            if (p.icon_url) {
              projectIcon = (
                <img
                  src={p.icon_url}
                  alt={p.name || "Project"}
                  className="w-10 h-10 rounded-lg object-cover border border-gray-700 bg-gray-800 flex-shrink-0"
                />
              );
            } else if (p.cover_url) {
              projectIcon = (
                <img
                  src={p.cover_url}
                  alt={p.name || "Project"}
                  className="w-10 h-10 rounded-lg object-cover border border-gray-700 bg-gray-800 flex-shrink-0"
                />
              );
            } else {
              projectIcon = (
                <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-5 h-5 text-emerald-300" />
                </div>
              );
            }
            return (
              <Link
                key={p.id}
                href={`/projects/${p.slug}`}
                className="group block rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 p-6 shadow-lg w-full transition hover:ring-2 hover:ring-emerald-400/60 focus:outline-none"
                tabIndex={0}
                aria-label={`View project ${p.name}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {projectIcon}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate group-hover:underline">
                      {p.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {timeAgo(p.created_at)}
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
            );
          })}
        </div>
      )}
    </>
  );
}