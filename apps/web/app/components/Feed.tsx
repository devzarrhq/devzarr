"use client";

import { useState } from "react";
import { useTheme } from "../theme-context";
import AddProjectModal from "./AddProjectModal";
import AddPostModal from "./AddPostModal";
import { Plus } from "lucide-react";

type Post = {
  id: string;
  title: string | null;
  body: string | null;
  created_at: string;
  project?: { name?: string | null; slug?: string | null; cover_url?: string | null } | null;
  author?: { handle?: string | null; display_name?: string | null; avatar_url?: string | null } | null;
};

export default function Feed({ initialPosts = [] as Post[] }) {
  const { accent } = useTheme();
  const posts = initialPosts;
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);

  return (
    <section className="w-full max-w-7xl mx-auto py-14 px-4">
      <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="flex flex-col">
          <h1
            className="text-5xl font-extrabold mb-2"
            style={{ color: `var(--tw-color-accent-${accent})` }}
          >
            Project Feed
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl">
            Discover indie dev tools, launches, and more.
          </p>
        </div>
        <div className="flex gap-4 flex-shrink-0">
          <button
            className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold shadow-lg transition-colors text-lg"
            style={{
              background: `var(--tw-color-accent-${accent})`,
              color: "#fff",
            }}
            onClick={() => setShowAddPost(true)}
          >
            <Plus className="w-6 h-6" />
            Add Post
          </button>
          <button
            className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold shadow-lg transition-colors text-lg"
            style={{
              background: `var(--tw-color-accent-${accent})`,
              color: "#fff",
            }}
            onClick={() => setShowAddProject(true)}
          >
            <Plus className="w-6 h-6" />
            Add Project
          </button>
        </div>
      </div>

      <AddProjectModal open={showAddProject} onClose={() => setShowAddProject(false)} wide />
      <AddPostModal open={showAddPost} onClose={() => setShowAddPost(false)} wide />

      {posts.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 rounded-xl p-10 shadow-lg border border-gray-800 flex flex-col gap-3"
            >
              <div className="h-7 w-1/2 bg-accent-blue/30 rounded mb-2 animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-700 rounded mb-1 animate-pulse" />
              <div className="h-4 w-1/3 bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 p-8 shadow-lg w-full"
              style={{ maxWidth: "100%" }}
            >
              <div className="flex items-center gap-3 mb-3">
                {p.author?.avatar_url ? (
                  <img
                    src={p.author.avatar_url!}
                    alt={p.author.display_name ?? p.author.handle ?? "author"}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gray-700" />
                )}
                <div className="leading-tight">
                  <div className="text-gray-100 font-medium">
                    {p.author?.display_name || p.author?.handle || "Anonymous"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="ml-auto text-xs text-gray-400">
                  {p.project?.name ? `in ${p.project.name}` : ""}
                </div>
              </div>

              {p.title ? <h3 className="text-lg font-semibold mb-1">{p.title}</h3> : null}
              {p.body ? <p className="text-gray-300 whitespace-pre-wrap">{p.body}</p> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}