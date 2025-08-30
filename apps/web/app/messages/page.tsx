import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { createSupabaseServer } from "@/lib/supabase/server";
import MessagesPageClient from "./MessagesPageClient";
import RightSidebarWidgets from "../components/RightSidebarWidgets";

export default async function MessagesPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen md:ml-64">
          <Topbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="p-8 text-gray-300">Sign in to use DMs.</div>
          </main>
        </div>
      </div>
    );
  }

  const { data: threads } = await supabase
    .from("dm_threads")
    .select("id, user_a, user_b, created_at")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const otherIds = (threads ?? []).map(t => (t.user_a === user.id ? t.user_b : t.user_a));
  const { data: profs } = otherIds.length
    ? await supabase.from("profiles")
        .select("user_id, handle, display_name, avatar_url")
        .in("user_id", otherIds)
    : { data: [] as any[] };

  const rows = (threads ?? []).map(t => {
    const other = profs?.find(p => p.user_id === (t.user_a === user.id ? t.user_b : t.user_a));
    return { ...t, other };
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Center column: Messages */}
          <section className="w-full py-10">
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
              <MessagesPageClient rows={rows} />
            </div>
          </section>
          {/* Right column: widgets */}
          <RightSidebarWidgets />
        </main>
      </div>
    </div>
  );
}