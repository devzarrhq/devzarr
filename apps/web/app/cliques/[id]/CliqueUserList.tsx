"use client";
import { UserCircle, Crown, Shield } from "lucide-react";

type Member = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
};

export default function CliqueUserList({ members }: { members: Member[] }) {
  return (
    <aside className="hidden lg:block w-[260px] flex-shrink-0 px-2 py-4 h-full">
      <div className="bg-white/5 rounded-xl border border-gray-800 shadow p-4 h-full flex flex-col">
        <div className="font-bold text-gray-200 mb-3 text-sm tracking-wide">Members</div>
        <ul className="space-y-2 flex-1 overflow-y-auto">
          {members.length === 0 ? (
            <li className="text-gray-400 text-sm">No members yet.</li>
          ) : (
            members.map((m) => (
              <li key={m.user_id} className="flex items-center gap-2">
                {/* Avatar */}
                {m.avatar_url ? (
                  <img
                    src={m.avatar_url}
                    alt={m.display_name || m.handle || "user"}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex flex-col leading-tight">
                  {m.display_name && (
                    <span className="text-xs text-gray-300 font-medium">
                      {m.display_name}
                    </span>
                  )}
                  <span className="truncate text-gray-100 text-sm font-bold flex items-center gap-1">
                    @{m.handle || "anonymous"}
                    {m.role === "owner" && (
                      <span
                        className="ml-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold"
                        title="Owner"
                      >
                        O
                        <Crown className="w-3 h-3 ml-0.5 text-white" />
                      </span>
                    )}
                    {m.role === "moderator" && (
                      <span
                        className="ml-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold"
                        title="Moderator"
                      >
                        M
                        <Shield className="w-3 h-3 ml-0.5 text-white" />
                      </span>
                    )}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
}