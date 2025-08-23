// apps/web/app/page.tsx  — SERVER COMPONENT (no "use client")

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Feed from "./components/Feed";

// If you moved it to app/lib/supabase/server.ts, use this:
import { createSupabaseServer } from "@/lib/supabase/server";
// If you kept your file under components/lib/... then use:
// import { createSupabaseServer } from "./components/lib/supabase/server";

export const dynamic = "force-dynamic"; // keep it fresh while iterating

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
  const posts = data ?? [];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1">
          <Feed initialPosts={posts} />
        </main>
      </div>
    </div>
  );
}
