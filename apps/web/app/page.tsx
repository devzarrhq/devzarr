import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Feed from "./components/Feed";
import RightSidebarWidgets from "./components/RightSidebarWidgets";
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
    return (
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <Sidebar />
        <div className="flex flex-1 flex-col lg:flex-row">
          <div className="w-full lg:w-3/4 xl:w-4/5 flex flex-col">
            <Topbar />
            <main className="flex-1 flex items-center justify-center px-6 py-8">
              <div className="text-center text-gray-400 mt-16">
                <p className="text-xl font-semibold">Error loading feed.</p>
                <p className="text-sm mt-2">{postsError.message}</p>
              </div>
            </main>
          </div>
          <aside className="hidden lg:block lg:w-1/4 xl:w-1/5 px-4 py-8">
            <RightSidebarWidgets />
          </aside>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <Sidebar />
        <div className="flex flex-1 flex-col lg:flex-row">
          <div className="w-full lg:w-3/4 xl:w-4/5 flex flex-col">
            <Topbar />
            <main className="flex-1 flex items-center justify-center px-6 py-8">
              <div className="text-center text-gray-400 mt-16">
                <p className="text-xl font-semibold">Nothing here... yet.</p>
                <p className="text-sm mt-2">
                  Be the first to share your brilliance. ✨
                </p>
              </div>
            </main>
          </div>
          <aside className="hidden lg:block lg:w-1/4 xl:w-1/5 px-4 py-8">
            <RightSidebarWidgets />
          </aside>
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
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="w-full lg:w-3/4 xl:w-4/5 flex flex-col">
          <Topbar />
          <main className="flex-1 px-6 py-8">
            <div className="mx-auto w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
              <Feed initialPosts={postsWithRelations} />
            </div>
          </main>
        </div>
        <aside className="hidden lg:block lg:w-1/4 xl:w-1/5 px-4 py-8">
          <RightSidebarWidgets />
        </aside>
      </div>
    </div>
  );
}