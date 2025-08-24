import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Feed from "./components/Feed";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createSupabaseServer();

  // 1. Fetch posts
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (postsError) {
    console.error("Feed query error:", postsError);
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen md:ml-64">
          <Topbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400 mt-16">
              <p className="text-xl font-semibold">Error loading feed.</p>
              <p className="text-sm mt-2">{postsError.message}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen md:ml-64">
          <Topbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400 mt-16">
              <p className="text-xl font-semibold">Nothing here... yet.</p>
              <p className="text-sm mt-2">
                Be the first to share your brilliance. ✨
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 2. Fetch related projects and profiles
  const projectIds = Array.from(new Set(posts.map((p) => p.project_id).filter(Boolean)));
  const authorIds = Array.from(new Set(posts.map((p) => p.author_id).filter(Boolean)));

  const [{ data: projects }, { data: profiles }] = await Promise.all([
    supabase.from("projects").select("id, name, slug, cover_url").in("id", projectIds),
    supabase.from("profiles").select("user_id, handle, display_name, avatar_url").in("user_id", authorIds),
  ]);

  const safeProjects = projects ?? [];
  const safeProfiles = profiles ?? [];

  // 3. Merge related data into posts
  const postsWithRelations = posts.map((post) => ({
    ...post,
    project: safeProjects.find((proj) => proj.id === post.project_id) || null,
    author: safeProfiles.find((prof) => prof.user_id === post.author_id) || null,
  }));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Center column: Feed */}
          <section className="w-full py-10">
            <div className="mx-auto w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl px-4 sm:px-6 lg:px-8">
              <Feed initialPosts={postsWithRelations} />
            </div>
          </section>
          {/* Right column: reserved for widgets */}
          <aside className="hidden lg:block w-[340px] flex-shrink-0 px-6 py-10 sticky top-16">
            {/* Future: Latest Projects, Featured Projects, etc. */}
          </aside>
        </main>
      </div>
    </div>
  );
}