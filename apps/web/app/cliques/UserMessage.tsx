"use client";
import React from "react";
import RoleName from "./RoleName";

// Simple linkify utility
function linkify(text: string) {
  const urlRegex = /((https?:\/\/[^\s]+))/g;
  return text.split(urlRegex).map((part, i) =>
    urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-emerald-300 break-all">{part}</a>
      : part
  );
}

type MemberRoles = Record<string, { role: string, voice: boolean }>;

export default function UserMessage({
  msg,
  cliqueId,
  memberRoles,
}: {
  msg: {
    id: string;
    body: string;
    author_id: string;
    created_at: string;
    author?: {
      handle: string | null;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  cliqueId: string;
  memberRoles: MemberRoles;
}) {
  return (
    <div key={msg.id} className="flex items-start gap-2 text-sm text-gray-100 bg-white/5 rounded-md px-3 py-2 w-fit max-w-[70%]">
      {/* Avatar */}
      {msg.author?.avatar_url ? (
        <img
          src={msg.author.avatar_url}
          alt={msg.author.display_name || msg.author.handle || "avatar"}
          className="w-7 h-7 rounded-full object-cover mr-2"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gray-700 mr-2 flex items-center justify-center text-xs text-gray-400">
          ?
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <RoleName
            userId={msg.author_id}
            handle={msg.author?.handle}
            displayName={msg.author?.display_name}
            memberRoles={memberRoles}
          />
          <span className="text-[10px] text-gray-400">
            {new Date(msg.created_at).toLocaleTimeString()}
          </span>
        </div>
        <div>{linkify(msg.body)}</div>
      </div>
    </div>
  );
}