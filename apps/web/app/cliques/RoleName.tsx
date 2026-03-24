"use client";
import React from "react";

type MemberRoles = Record<string, { role: string, voice: boolean }>;

export default function RoleName({
  userId,
  handle,
  displayName,
  memberRoles,
}: {
  userId: string;
  handle?: string | null;
  displayName?: string | null;
  memberRoles: MemberRoles;
}) {
  const info = memberRoles[userId] || { role: null, voice: false };
  let prefix = "";
  let color = "#e5e7eb"; // gray-200
  if (info.role === "owner") { prefix = "@"; color = "#4ade80"; }
  else if (info.role === "mod") { prefix = "^"; color = "#f59e42"; }
  else if (info.voice) { prefix = "+"; color = "#fde047"; }
  return (
    <span className="font-semibold text-xs" style={{ color }}>
      {prefix}
      {displayName || handle || "Anonymous"}
    </span>
  );
}