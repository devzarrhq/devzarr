"use client";
import React from "react";
import { useTheme } from "../theme-context";
import AddCliqueModal from "./AddCliqueModal";
import CliquesSearch from "./CliquesSearch";

export function CliquesPageClient({ cliques, memberCounts }: { cliques: any[]; memberCounts: Record<string, number> }) {
  const { accent } = useTheme();
  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 items-start mb-8">
        <h1
          className="text-4xl md:text-5xl font-extrabold"
          style={{ color: `var(--tw-color-accent-${accent})` }}
        >
          Cliques
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl">
          Find and join real-time dev groups.
        </p>
        <AddCliqueModal />
      </div>
      <CliquesSearch cliques={cliques} memberCounts={memberCounts} />
    </div>
  );
}