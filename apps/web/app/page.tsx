import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Feed from "./components/Feed";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createSupabaseServer();

  const { data, error } = await supabase
    .from("posts")
    .select(`
      id, title, body, created_at,
      project:projects(name, slug, cover_url),
      author:profiles(handle, display_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) console.error("Feed query error:", error);
  // Fix: Map project/author from array to object if needed
  const posts = (data ?? []).map((p: any) => ({
    ...p,
    project: Array.isArray(p.project) ? p.project[0] : p.project,
    author: Array.isArray(p.author) ? p.author[0] : p.author,
  }));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 flex flex-col md:flex-row gap-0">
          {/* Center column: Feed */}
          <section className="flex-1 flex items-start justify-center py-10">
            <div className="w-full max-w-2xl">
              <Feed initialPosts={posts} />
            </div>
          </section>
          {/* Right column: reserved for widgets */}
          <aside className="hidden lg:block w-[340px] flex-shrink-0 px-6 py-10">
            {/* Future: Latest Projects, Featured Projects, etc. */}
          </aside>
        </main>
      </div>
    </div>
  );
}