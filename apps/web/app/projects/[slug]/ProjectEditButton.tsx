"use client";
import { useAuth } from "../../providers/AuthProvider";
import { useTheme } from "../../theme-context";
import Link from "next/link";
import { Pencil } from "lucide-react";

export default function ProjectEditButton({ ownerId, slug }: { ownerId: string; slug: string }) {
  const { user } = useAuth();
  const { accent } = useTheme();
  if (!user || user.id !== ownerId) return null;
  return (
    <Link
      href={`/projects/${slug}/edit`}
      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white font-semibold text-sm transition ml-2 hover:opacity-90"
      style={{ background: `var(--tw-color-accent-${accent})` }}
      title="Edit Project"
    >
      <Pencil className="w-4 h-4" />
      Edit
    </Link>
  );
}