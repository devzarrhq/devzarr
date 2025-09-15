"use client";
import React from "react";

export default function SystemMessage({ body }: { body: string }) {
  return (
    <div className="w-full flex justify-center my-1">
      <div
        className="bg-orange-900/30 border border-orange-500/40 text-orange-300 font-semibold rounded-md px-3 py-2 text-base shadow"
        style={{ letterSpacing: "0.01em" }}
      >
        {body}
      </div>
    </div>
  );
}