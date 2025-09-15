"use client";
import React from "react";

export default function SystemMessage({ body }: { body: string }) {
  return (
    <div className="flex items-start gap-2 text-base w-full max-w-full">
      <div
        className="bg-orange-900/80 border border-orange-500/60 text-orange-200 font-semibold rounded-lg px-4 py-2 shadow w-full"
        style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
      >
        {body}
      </div>
    </div>
  );
}