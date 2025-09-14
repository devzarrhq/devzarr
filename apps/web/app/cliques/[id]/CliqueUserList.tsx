"use client";
import { UserCircle } from "lucide-react";

type Member = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  voice?: boolean;
};

export default function CliqueUserList({ members, online }: { members: Member[]; online?: Set<string> }) {
  return (
    <aside className="hidden lg:block w-[260px] flex-shrink-0 px-2 py-4 h-full">
      <div className="bg-white/5 rounded-xl border border-gray-800 shadow p-4 h-full flex flex-col">
        <div className="font-bold text-gray-200 mb-3 text-sm tracking-wide">Members</div>
        <ul className="space-y-2 flex-1 overflow-y-auto">
          {members.length === 0 ? (
            <li className="text-gray-400 text-sm">No members yet.</li>
          ) : (
            members.map((m) => {
              let prefix = "";
              let roleTint = "text-gray-100";
              let style: React.CSSProperties = {};
              if (m.role === "owner") {
                prefix = "@";
                roleTint = "text-emerald-300";
              } else if (m.role === "mod") {
                prefix = "^";
                roleTint = "";
                style = { color: "#f59e42", fontWeight: 700 }; // Tailwind orange-400
              } else if (m.voice) {
                prefix = "+";
                roleTint = "";
                style = { color: "#fde047", fontWeight: 700 }; // Tailwind yellow-300
              }
              return (
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
                  {/* Online badge */}
                  <div className={`w-2 h-2 rounded-full ${online?.has(m.user_id) ? "bg-emerald-400" : "bg-gray-600"}`} />
                  <span className={`truncate text-sm font-bold ${roleTint}`} style={style}>
                    {prefix}
                    {m.handle ?? "anonymous"}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </aside>
  );
}