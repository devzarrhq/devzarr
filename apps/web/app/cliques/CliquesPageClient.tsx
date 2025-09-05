"use client";
import React from "react";
import Sidebar from "../components/Sidebar";
// import Topbar from "../components/Topbar"; // REMOVE this import
import { useTheme } from "../theme-context";
import AddCliqueModal from "./AddCliqueModal";
import CliquesSearch from "./CliquesSearch";

export function CliquesPageClient({ cliques, memberCounts }: { cliques: any[]; memberCounts: Record<string, number> }) {
  const { accent } = useTheme();
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      {/* Sidebar is handled at the page level */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        {/* Topbar is handled at the page level */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Center column: Cliques */}
          <section className="w-full py-10">
            <div className="mx-auto w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl px-4 sm:px-6 lg:px-8">
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
          </section>
          {/* Right column: reserved for widgets */}
          {/* The right sidebar is handled at the page level */}
        </main>
      </div>
    </div>
  );
}