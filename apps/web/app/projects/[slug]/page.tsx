import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import FollowButton from "./FollowButton";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import RightSidebarWidgets from "../../components/RightSidebarWidgets";
import { Users } from "lucide-react";
import dynamic from "next/dynamic";

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

              {/* Project Icon, Title, Tagline, Owner */}
              <div className="flex items-center gap-6 mb-6">
                {project.icon_url ? (
                  <img src={project.icon_url} alt="Project Icon" className="w-20 h-20 rounded-xl object-cover border-4 border-gray-900 bg-gray-800" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-700 border-4 border-gray-900 flex items-center justify-center text-3xl text-gray-400">
                    <Users className="w-10 h-10" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold text-white">{project.name}</h1>
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
                <div className="flex flex-wrap gap-3 mb-4">
                  {project.homepage_url && (
                    <a href={project.homepage_url} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline font-semibold">Homepage</a>
                  )}
                  {project.repo_url && (
                    <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline font-semibold">Repository</a>
                  )}
                  {project.docs_url && (
                    <a href={project.docs_url} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline font-semibold">Docs</a>
                  )}
                  {project.package_url && (
                    <a href={project.package_url} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline font-semibold">Package</a>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mb-4">
                  {project.contact_email && (
                    <a href={`mailto:${project.contact_email}`} className="text-gray-300 underline">Email</a>
                  )}
                  {project.contact_discord && (
                    <a href={project.contact_discord} target="_blank" rel="noopener noreferrer" className="text-gray-300 underline">Discord</a>
                  )}
                  {project.contact_matrix && (
                    <a href={project.contact_matrix} target="_blank" rel="noopener noreferrer" className="text-gray-300 underline">Matrix</a>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mb-4">
                  {project.support_kofi && (
                    <a href={project.support_kofi} target="_blank" rel="noopener noreferrer" className="text-pink-400 underline">Ko-fi</a>
                  )}
                  {project.support_patreon && (
                    <a href={project.support_patreon} target="_blank" rel="noopener noreferrer" className="text-pink-400 underline">Patreon</a>
                  )}
                  {project.support_bmac && (
                    <a href={project.support_bmac} target="_blank" rel="noopener noreferrer" className="text-pink-400 underline">BuyMeACoffee</a>
                  )}
                  {project.support_github && (
                    <a href={project.support_github} target="_blank" rel="noopener noreferrer" className="text-pink-400 underline">GitHub Sponsors</a>
                  )}
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