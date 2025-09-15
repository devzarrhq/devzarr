"use client";
import React from "react";

export default function SystemMessage({ body }: { body: string }) {
  return (
    <div className="w-full flex justify-center my-2">
      <div className="bg-orange-900/30 border border-orange-500/40 text-orange-300 font-semibold rounded px-4 py-2 text-center w-fit text-sm shadow"
        style={{ fontStyle: "italic", letterSpacing: "0.01em" }}
      >
        {body}
      </div>
    </div>
  );
}