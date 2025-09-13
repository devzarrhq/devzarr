import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import FollowButton from "./FollowButton";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import RightSidebarWidgets from "../../components/RightSidebarWidgets";
import { Users } from "lucide-react";
import dynamic from "next/dynamic";
import ProjectEditButton from "./ProjectEditButton";
import FundraisingGoal from "./FundraisingGoal";
import AddUpdateButton from "./AddUpdateButton";
import ReactMarkdown from "react-markdown";

// --- Relative time utility ---
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

const ProjectDescription = dynamic(() => import("../../components/ProjectDescription"), { ssr: false });

function parseGoalAmount(note?: string): number | null {
  if (!note) return null;
  const match = note.match(/\$?([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ""), 10);
  }
  return null;
}

function isJustDollarAmount(note?: string): boolean {
  if (!note) return false;
  return /^\$?\d[\d,]*$/.test(note.trim());
}

const amountRaised = 500; // Example: $500 raised

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServer();

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

  const { data: owner } = await supabase
    .from("profiles")
    .select("user_id, handle, display_name, avatar_url")
    .eq("user_id", project.owner_id)
    .single();

  const [{ count: followerCount }, { data: posts }] = await Promise.all([
    supabase.from("project_follows").select("*", { count: "exact", head: true }).eq("project_id", project.id),
    supabase.from("posts").select("id, title, body, created_at, author_id").eq("project_id", project.id).order("created_at", { ascending: false }).limit(10),
  ]);

  const goalAmount = parseGoalAmount(project.funding_goal_note);
  const progress = goalAmount ? Math.min(100, Math.round((amountRaised / goalAmount) * 100)) : 0;

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

  // Get current user id for owner check (SSR-safe)
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <div className="flex flex-1 flex-row min-h-0">
          <div className="flex-1 flex flex-col md:ml-64 lg:mr-[340px] px-4 min-h-0">
            <main className="flex-1 flex flex-col min-h-0">
              {/* Twitter-style banner */}
              <div className="w-full rounded-2xl overflow-hidden mb-6" style={{ height: "220px", maxHeight: "220px" }}>
                {project.banner_url ? (
                  <img
                    src={project.banner_url}
                    alt="Banner"
                    className="object-cover object-center w-full h-full"
                    style={{ width: "100%", height: "100%", display: "block" }}
                  />
                ) : (
                  <div className="w-full h-full bg-white/10" />
                )}
              </div>

              {/* Project Icon, Title, Tagline, Owner, Edit button */}
              <div className="flex items-center gap-8 mb-6">
                {project.icon_url ? (
                  <img src={project.icon_url} alt="Project Icon" className="w-20 h-20 rounded-xl object-cover border-4 border-gray-900 bg-gray-800" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-700 border-4 border-gray-900 flex items-center justify-center text-3xl text-gray-400">
                    <Users className="w-10 h-10" />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-white">{project.name}</h1>
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
                {/* Fundraising Goal */}
                {goalAmount && (
                  <div className="mb-4">
                    <FundraisingGoal goalAmount={goalAmount} />
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
                        <div
                          className="h-4 rounded-full transition-all absolute left-0 top-0"
                          style={{
                            width: `${progress}%`,
                            background: "var(--tw-color-accent-emerald, #10b981)",
                            minWidth: progress > 0 ? "8px" : "0"
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-200 font-semibold ml-2">
                        ${amountRaised.toLocaleString()} raised
                      </span>
                    </div>
                  </div>
                )}
                {project.funding_goal_note && !isJustDollarAmount(project.funding_goal_note) && (
                  <div className="text-yellow-200 font-medium mt-2">{project.funding_goal_note}</div>
                )}
              </section>

              {/* Recent Updates */}
              <section className="mt-10 space-y-4">
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-xl font-semibold text-white flex-1">Recent Updates</h2>
                  {/* Only show Add Update button for project owner */}
                  {user && user.id === project.owner_id && <AddUpdateButton projectId={project.id} />}
                </div>
                {posts?.length ? posts.map(p => (
                  <article key={p.id} className="rounded-xl bg-white/5 ring-1 ring-white/10 p-5 flex items-start gap-4">
                    {/* Project icon/avatar */}
                    {project.icon_url ? (
                      <img src={project.icon_url} alt="Project Icon" className="w-10 h-10 rounded-lg object-cover border border-gray-800 bg-gray-800 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-emerald-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {/* Owner badge */}
                        {owner?.avatar_url ? (
                          <img src={owner.avatar_url} alt={owner.display_name || owner.handle} className="w-7 h-7 rounded-full object-cover border border-gray-800" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-700" />
                        )}
                        <span className="font-semibold text-gray-200 text-sm">
                          {owner?.display_name || owner?.handle || "Owner"}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">{timeAgo(p.created_at)}</span>
                      </div>
                      {p.title && <h3 className="mt-1 font-semibold text-gray-100">{p.title}</h3>}
                      {p.body && (
                        <div className="prose prose-invert max-w-none mt-1">
                          <ReactMarkdown>{p.body}</ReactMarkdown>
                        </div>
                      )}
                    </div>
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