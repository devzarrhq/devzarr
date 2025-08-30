import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import FollowButton from "./FollowButton";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import RightSidebarWidgets from "../../components/RightSidebarWidgets";

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServer();

  // project + owner
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug, summary, url, cover_url, owner_id")
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

  const [{ count: followerCount }, { data: posts }] = await Promise.all([
    supabase.from("project_follows").select("*", { count: "exact", head: true }).eq("project_id", project.id),
    supabase.from("posts").select("id, title, body, created_at, author_id").eq("project_id", project.id).order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="w-full">
            <header className="relative">
              {project.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.cover_url} alt="" className="h-48 w-full object-cover opacity-80" />
              ) : <div className="h-24 bg-white/5" />}
            </header>

            <div className="mx-auto max-w-5xl px-6 py-8">
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                  <p className="mt-2 text-gray-300">{project.summary || "No summary yet."}</p>
                  {project.url && (
                    <p className="mt-2">
                      <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">Visit project →</a>
                    </p>
                  )}
                </div>

                {/* Follow button */}
                <FollowButton projectId={project.id} followerCount={followerCount ?? 0} />
              </div>

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
            </div>
          </section>
          <RightSidebarWidgets />
        </main>
      </div>
    </div>
  );
}