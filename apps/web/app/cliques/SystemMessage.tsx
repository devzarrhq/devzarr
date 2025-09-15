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
    <div className="flex items-start gap-2 w-full max-w-full">
      <div
        className="bg-orange-900/80 border border-orange-500/60 !text-orange-200 font-semibold rounded-lg px-4 py-2 pt-6 shadow w-full relative text-sm"
        style={{ wordBreak: "break-word", overflowWrap: "anywhere", color: "#fdba74", minHeight: "44px" }}
      >
        <span className="absolute top-2 right-4 text-xs text-orange-300 font-normal">
          {timeAgo(created_at)}
        </span>
        {body}
      </div>
    </div>
  );
}