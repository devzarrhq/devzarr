import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Feed from "./components/Feed";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createSupabaseServer();

  // Simple test query
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .limit(5);

  if (error) console.error("Feed query error:", error);

  const posts = data ?? [];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 flex flex-col md:flex-row gap-0">
          {/* Center column: Feed */}
          <section className="flex-1 flex items-start justify-center py-10">
            <div className="w-full max-w-2xl">
              {posts.length === 0 ? (
                <div className="text-center text-gray-400 mt-16">
                  <p className="text-xl font-semibold">Nothing here... yet.</p>
                  <p className="text-sm mt-2">
                    Be the first to share your brilliance. ✨
                  </p>
                </div>
              ) : (
                <Feed initialPosts={posts} />
              )}
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