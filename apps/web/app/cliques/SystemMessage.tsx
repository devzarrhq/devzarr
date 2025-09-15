"use client";
import React from "react";

// Utility for relative time
function timeAgo(date: string | Date) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr${Math.floor(diff / 3600) === 1 ? "" : "s"} ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? "" : "s"} ago`;
  return then.toLocaleDateString();
}

export default function SystemMessage({ body, created_at }: { body: string; created_at: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-gray-100 bg-white/5 rounded-md px-3 py-2 w-fit max-w-[70%]">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-orange-400">[system]</span>
          <span className="text-xs text-gray-400">{timeAgo(created_at)}</span>
        </div>
        <div className="text-orange-200">{body}</div>
      </div>
    </div>
  );
}