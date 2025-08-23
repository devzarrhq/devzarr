"use client";

import { useTheme } from "../theme-context";

export default function Feed() {
  const { accent } = useTheme();

  return (
    <section className="w-full max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2" style={{ color: `var(--tw-color-accent-${accent})` }}>
          Project Feed
        </h1>
        <p className="text-gray-300 text-lg">Discover indie dev tools, launches, and more.</p>
      </div>
      {/* Placeholder for project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 rounded-xl p-8 shadow-lg border border-gray-800 flex flex-col gap-3"
          >
            <div className="h-7 w-1/2 bg-accent-blue/30 rounded mb-2 animate-pulse" />
            <div className="h-4 w-2/3 bg-gray-700 rounded mb-1 animate-pulse" />
            <div className="h-4 w-1/3 bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}