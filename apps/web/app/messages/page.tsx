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
      <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
        <Sidebar />
        <div className="flex flex-1 flex-col min-h-screen">
          <Topbar />
          <div className="flex flex-1 flex-row">
            <div className="flex-1 flex flex-col">
              <main className="flex-1 flex items-center justify-center">
                <div className="p-8 text-gray-300">Sign in to use DMs.</div>
              </main>
            </div>
            <aside className="hidden lg:block lg:w-[340px] flex-shrink-0 px-6 py-10">
              <RightSidebarWidgets />
            </aside>
          </div>
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
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <div className="flex flex-1 flex-row">
          <div className="flex-1 flex flex-col">
            <main className="w-full py-10">
              <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
                <MessagesPageClient rows={rows} />
              </div>
            </main>
          </div>
          <aside className="hidden lg:block lg:w-[340px] flex-shrink-0 px-6 py-10">
            <RightSidebarWidgets />
          </aside>
        </div>
      </div>
    </div>
  );
}