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
  if (info.role === "owner") prefix = "@";
  else if (info.role === "mod") prefix = "^";
  else if (info.voice) prefix = "+";
  return (
    <span className="font-semibold text-xs text-emerald-300">
      {prefix}
      {displayName || handle || "Anonymous"}
    </span>
  );
}