type PostCardProps = {
  id: string;
  title: string | null;
  body: string | null;
  created_at: string;
  project?: { name: string | null; slug: string | null; cover_url: string | null } | null;
  author?: { handle: string | null; display_name: string | null; avatar_url: string | null } | null;
};

export default function PostCard({ title, body, created_at, project, author }: PostCardProps) {
  return (
    <article className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 hover:bg-zinc-900 transition">
      <div className="flex items-center gap-3 mb-3">
        {author?.avatar_url ? (
          <img
            src={author.avatar_url}
            alt={author.display_name ?? author.handle ?? "author"}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-zinc-700" />
        )}
        <div className="leading-tight">
          <div className="text-zinc-200 font-medium">
            {author?.display_name || author?.handle || "Anonymous"}
          </div>
          <div className="text-xs text-zinc-400">
            {new Date(created_at).toLocaleString()}
          </div>
        </div>
        <div className="ml-auto text-xs text-zinc-400">
          {project?.name ? `in ${project.name}` : ""}
        </div>
      </div>

      {title ? <h3 className="text-lg font-semibold mb-1">{title}</h3> : null}
      {body ? <p className="text-zinc-300 whitespace-pre-wrap">{body}</p> : null}
    </article>
  );
}
