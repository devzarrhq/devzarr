"use client";

export default function Feed() {
  return (
    <section className="max-w-2xl mx-auto py-8 px-2">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Project Feed</h1>
        <p className="text-gray-400">Discover indie dev tools, launches, and more.</p>
      </div>
      {/* Placeholder for project cards */}
      <div className="space-y-4">
        <div className="bg-gray-900 rounded-lg p-6 shadow border border-gray-800">
          <div className="h-6 w-1/3 bg-gray-800 rounded mb-2 animate-pulse" />
          <div className="h-4 w-2/3 bg-gray-800 rounded mb-1 animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="bg-gray-900 rounded-lg p-6 shadow border border-gray-800">
          <div className="h-6 w-1/4 bg-gray-800 rounded mb-2 animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-800 rounded mb-1 animate-pulse" />
          <div className="h-4 w-1/3 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    </section>
  );
}