import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import FollowButton from "./FollowButton";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import RightSidebarWidgets from "../../components/RightSidebarWidgets";
import { Users } from "lucide-react";
import dynamic from "next/dynamic";
import ProjectEditButton from "./ProjectEditButton";

const ProjectDescription = dynamic(() => import("../../components/ProjectDescription"), { ssr: false });

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServer();

  // project + owner
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug, summary, url, cover_url, owner_id, icon_url, banner_url, tagline, description, type, status, homepage_url, repo_url, docs_url, package_url, contact_email, contact_discord, contact_matrix, support_kofi, support_patreon, support_bmac, support_github, funding_goal_note")
    .eq("slug", params.slug)
    .single();

  if (!project) return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="p-8 text-gray-300">Project not found.</div>
        </main>
      </div>
    </div>
  );

  // Fetch owner profile
  const { data: owner } = await supabase
    .from("profiles")
    .select("user_id, handle, display_name, avatar_url")
    .eq("user_id", project.owner_id)
    .single();

  // Followers count
  const [{ count: followerCount }, { data: posts }] = await Promise.all([
    supabase.from("project_follows").select("*", { count: "exact", head: true }).eq("project_id", project.id),
    supabase.from("posts").select("id, title, body, created_at, author_id").eq("project_id", project.id).order("created_at", { ascending: false }).limit(10),
  ]);

  // Helper: Render a labeled link or value if present
  function InfoRow({ label, value, href, color }: { label: string, value?: string, href?: string, color?: string }) {
    if (!value) return null;
    return (
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-gray-300 min-w-[120px]">{label}:</span>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={`underline font-semibold ${color || "text-emerald-300"}`}>
            {value}
          </a>
        ) : (
          <span className="text-gray-200">{value}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <div className="flex flex-1 flex-row">
          <div className="flex-1 flex flex-col md:ml-64 lg:mr-[340px] px-4">
            <main className="flex-1 flex flex-col">
              {/* Banner/Header */}
              {project.banner_url ? (
                <div className="w-full h-48 sm:h-56 rounded-t-2xl overflow-hidden mb-4">
                  <img src={project.banner_url} alt="Banner" className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className="h-24 bg-white/5 rounded-t-2xl mb-4" />
              )}

              {/* Project Icon, Title, Tagline, Owner, Edit button */}
              <div className="flex items-center gap-6 mb-6">
                {project.icon_url ? (
                  <img src={project.icon_url} alt="Project Icon" className="w-20 h-20 rounded-xl object-cover border-4 border-gray-900 bg-gray-800" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-700 border-4 border-gray-900 flex items-center justify-center text-3xl text-gray-400">
                    <Users className="w-10 h-10" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                    {/* Edit button for owner (client component) */}
                    <ProjectEditButton ownerId={project.owner_id} slug={project.slug} />
                  </div>
                  {project.tagline && (
                    <div className="text-lg text-emerald-300 font-medium mt-1">{project.tagline}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {owner?.avatar_url ? (
                      <img src={owner.avatar_url} alt={owner.display_name || owner.handle} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700" />
                    )}
                    <Link href={`/profile/${owner?.handle || owner?.user_id}`} className="text-gray-200 font-semibold hover:underline">
                      {owner?.display_name || owner?.handle || "Owner"}
                    </Link>
                  </div>
                </div>
                {/* Follow button */}
                <FollowButton projectId={project.id} followerCount={followerCount ?? 0} />
              </div>

              {/* Project Details */}
              <section className="mb-8">
                <div className="flex flex-wrap gap-4 mb-4">
                  {project.type && (
                    <span className="px-3 py-1 rounded-full bg-emerald-700/20 text-emerald-300 text-xs font-semibold">
                      {project.type}
                    </span>
                  )}
                  {project.status && (
                    <span className="px-3 py-1 rounded-full bg-blue-700/20 text-blue-300 text-xs font-semibold">
                      {project.status}
                    </span>
                  )}
                </div>
                {project.description && (
                  <ProjectDescription description={project.description} />
                )}

                {/* --- All Project Links and Details --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-4">
                  <InfoRow label="Homepage" value={project.homepage_url} href={project.homepage_url} />
                  <InfoRow label="Repository" value={project.repo_url} href={project.repo_url} />
                  <InfoRow label="Docs" value={project.docs_url} href={project.docs_url} />
                  <InfoRow label="Package" value={project.package_url} href={project.package_url} />
                  <InfoRow label="Contact Email" value={project.contact_email} href={project.contact_email ? `mailto:${project.contact_email}` : undefined} color="text-gray-300" />
                  <InfoRow label="Discord" value={project.contact_discord} href={project.contact_discord} color="text-indigo-400" />
                  <InfoRow label="Matrix" value={project.contact_matrix} href={project.contact_matrix} color="text-indigo-400" />
                  <InfoRow label="Ko-fi" value={project.support_kofi} href={project.support_kofi} color="text-pink-400" />
                  <InfoRow label="Patreon" value={project.support_patreon} href={project.support_patreon} color="text-pink-400" />
                  <InfoRow label="BuyMeACoffee" value={project.support_bmac} href={project.support_bmac} color="text-pink-400" />
                  <InfoRow label="GitHub Sponsors" value={project.support_github} href={project.support_github} color="text-pink-400" />
                </div>
                {project.funding_goal_note && (
                  <div className="text-yellow-300 font-semibold mt-2">{project.funding_goal_note}</div>
                )}
              </section>

              {/* Recent Updates */}
              <section className="mt-10 space-y-4">
                <h2 className="text-xl font-semibold text-white">Recent Updates</h2>
                {posts?.length ? posts.map(p => (
                  <article key={p.id} className="rounded-xl bg-white/5 ring-1 ring-white/10 p-5">
                    <div className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString()}</div>
                    {p.title && <h3 className="mt-1 font-semibold text-gray-100">{p.title}</h3>}
                    {p.body && <p className="text-gray-300 mt-1 whitespace-pre-wrap">{p.body}</p>}
                  </article>
                )) : <div className="text-gray-400">No updates yet.</div>}
              </section>
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