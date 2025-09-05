import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { createSupabaseServer } from "@/lib/supabase/server";
import DMChat from "./ui/DMChat";
import RightSidebarWidgets from "../../components/RightSidebarWidgets";

export default async function ThreadPage({ params }: { params: { threadId: string } }) {
  const supabase = createSupabaseServer();
  // confirm membership
  const { data: t } = await supabase
    .from("dm_threads")
    .select("id, user_a, user_b")
    .eq("id", params.threadId)
    .single();
  if (!t) return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="p-8 text-gray-300">Thread not found.</div>
        </main>
      </div>
    </div>
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return (
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

  const otherId = t.user_a === user.id ? t.user_b : t.user_a;
  const { data: other } = await supabase
    .from("profiles")
    .select("user_id, handle, display_name, avatar_url")
    .eq("user_id", otherId)
    .single();

  const { data: msgs } = await supabase
    .from("dm_messages")
    .select("id, author_id, body, created_at")
    .eq("thread_id", params.threadId)
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <div className="flex flex-1 flex-row">
          <div className="flex-1 flex flex-col md:ml-64 lg:mr-[340px]">
            <main className="w-full py-10">
              <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 flex flex-col flex-1 min-h-0">
                <div className="flex items-center gap-3 mb-6">
                  {other?.avatar_url ? (
                    <img src={other.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400 text-xl">?</span>
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-white text-lg">
                      {other?.display_name || other?.handle || "User"}
                    </div>
                    <div className="text-xs text-gray-400">@{other?.handle}</div>
                  </div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col">
                  <DMChat threadId={params.threadId} initialMessages={msgs ?? []} />
                </div>
              </div>
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