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

  // Defensive: if posts is null, treat as empty array
  const safePosts = Array.isArray(posts) ? posts : [];

  // 2. Fetch related projects and profiles
  const projectIds = Array.from(new Set(safePosts.map((p) => p.project_id).filter(Boolean)));
  const authorIds = Array.from(new Set(safePosts.map((p) => p.author_id).filter(Boolean)));

  const [{ data: projects }, { data: profiles }] = await Promise.all([
    supabase.from("projects").select("id, name, slug, cover_url").in("id", projectIds),
    supabase.from("profiles").select("user_id, handle, display_name, avatar_url").in("user_id", authorIds),
  ]);

  const safeProjects = projects ?? [];
  const safeProfiles = profiles ?? [];

  // 3. Merge related data into posts
  const postsWithRelations = safePosts.map((post) => ({
    ...post,
    project: safeProjects.find((proj) => proj.id === post.project_id) || null,
    author: safeProfiles.find((prof) => prof.user_id === post.author_id) || null,
  }));

  return (
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <div className="flex flex-1 flex-row">
          <div className="flex-1 flex flex-col md:ml-64 lg:mr-[340px]">
            <main className="flex-1 px-6 py-8 max-w-5xl mx-auto">
              <Feed initialPosts={postsWithRelations} />
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