"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ChevronRight } from "lucide-react";

// ... (rest of the file unchanged)

const HELP_COMMANDS = [
  {
    cmd: "/topic <new topic>",
    desc: "Set the channel topic (owner/mod only)",
  },
  {
    cmd: "/mode @user +m/-m/+o",
    desc: "Promote/demote moderator or transfer ownership (owner/mod only)",
  },
  {
    cmd: "/kick @user",
    desc: "Remove a user from the clique (owner/mod only)",
  },
  {
    cmd: "/ban @user",
    desc: "Ban a user from the clique (owner/mod only)",
  },
  {
    cmd: "/help",
    desc: "Show this help popup",
  },
];

export default function Chat({ cliqueId, topic }: { cliqueId: string, topic?: string }) {
  // ... (rest of the component unchanged)

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl bg-white/5 ring-1 ring-white/10">
      {/* ... */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className="bg-gray-900 rounded-2xl shadow-2xl p-6 border border-emerald-400 flex flex-col items-center"
            style={{
              width: "100%",
              maxWidth: 420,
              minWidth: 0,
              margin: "0 auto",
            }}
          >
            <h2 className="text-lg font-bold mb-3 text-emerald-300 text-center">Clique Chat Commands</h2>
            <div className="w-full">
              <div className="font-semibold text-gray-100 mb-2">Available Commands:</div>
              <ul className="space-y-2 mb-6">
                {HELP_COMMANDS.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5">
                      <ChevronRight className="w-4 h-4 text-emerald-300" />
                    </span>
                    <span>
                      <span className="text-emerald-300 font-mono font-semibold">{c.cmd}</span>
                      <span className="text-gray-400"> — {c.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="mt-0 px-4 py-2 rounded bg-emerald-500/90 text-white font-semibold"
              onClick={() => setShowHelp(false)}
              autoFocus
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* ... */}
    </div>
  );
}

// ... (rest of the file unchanged)