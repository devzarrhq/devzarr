"use client";

import { useState } from "react";
import { useTheme } from "../theme-context";
import AddProjectModal from "./AddProjectModal";
import AddPostModal from "./AddPostModal";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

// --- Relative time utility ---
function timeAgo(date: string | Date) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr${Math.floor(diff / 3600) === 1 ? "" : "s"} ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? "" : "s"} ago`;
  return then.toLocaleDateString();
}

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
    <section className="w-full flex flex-col gap-10 py-10 px-0">
      <div className="flex flex-col gap-4 items-start">
        <h1
          className="text-4xl md:text-5xl font-extrabold"
          style={{ color: `var(--tw-color-accent-${accent})` }}
        >
          Project Feed
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl">
          Discover indie dev tools, launches, and more.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-md transition-colors text-sm md:text-base"
            style={{
              background: `var(--tw-color-accent-${accent})`,
              color: "#fff",
            }}
            onClick={() => setShowAddPost(true)}
          >
            <Plus className="w-5 h-5" />
            Add Post
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-md transition-colors text-sm md:text-base"
            style={{
              background: `var(--tw-color-accent-${accent})`,
              color: "#fff",
            }}
            onClick={() => setShowAddProject(true)}
          >
            <Plus className="w-5 h-5" />
            Add Project
          </button>
        </div>
      </div>

      <AddProjectModal open={showAddProject} onClose={() => setShowAddProject(false)} wide />
      <AddPostModal open={showAddPost} onClose={() => setShowAddPost(false)} wide />

      {posts.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 rounded-xl p-10 shadow-lg border border-gray-800 flex flex-col gap-3 w-full"
            >
              <div className="h-7 w-1/2 bg-accent-blue/30 rounded mb-2 animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-700 rounded mb-1 animate-pulse" />
              <div className="h-4 w-1/3 bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-8 w-full">
          {posts.map((p) => {
            // Project avatar/icon
            const projectIcon = p.project?.cover_url ? (
              <img
                src={p.project.cover_url}
                alt={p.project.name || "Project"}
                className="w-10 h-10 rounded-lg object-cover border border-gray-700 bg-gray-800 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-emerald-300" />
              </div>
            );
            // Author avatar
            const authorAvatar = p.author?.avatar_url ? (
              <img
                src={p.author.avatar_url!}
                alt={p.author.display_name ?? p.author.handle ?? "author"}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gray-700" />
            );
            // Owner badge
            const ownerBadge = (
              <span className="font-semibold text-gray-200 text-sm">
                {p.author?.display_name || p.author?.handle || "Anonymous"}
              </span>
            );
            // Relative time
            const relTime = <span className="text-xs text-gray-400 ml-2">{timeAgo(p.created_at)}</span>;

            // Main post card
            const cardContent = (
              <div className="flex items-start gap-4">
                {projectIcon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {authorAvatar}
                    {ownerBadge}
                    {relTime}
                    {p.project?.name && (
                      <span className="ml-auto text-xs text-emerald-300">
                        in {p.project.name}
                      </span>
                    )}
                  </div>
                  {p.title && <h3 className="mt-1 font-semibold text-gray-100">{p.title}</h3>}
                  {p.body && (
                    <div className="prose prose-invert max-w-none mt-1" style={{ color: "#fff" }}>
                      <ReactMarkdown>{p.body}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );

            // If project has a slug, wrap in link
            return p.project?.slug ? (
              <Link
                key={p.id}
                href={`/projects/${p.project.slug}`}
                className="group block rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 p-8 shadow-lg w-full transition hover:ring-2 hover:ring-emerald-400/60 focus:outline-none"
                tabIndex={0}
                aria-label={`View project ${p.project.name}`}
              >
                {cardContent}
              </Link>
            ) : (
              <article
                key={p.id}
                className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 p-8 shadow-lg w-full"
              >
                {cardContent}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}