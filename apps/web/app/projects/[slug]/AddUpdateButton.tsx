"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddUpdateModal from "./AddUpdateModal";
import { useTheme } from "../../theme-context";

export default function AddUpdateButton({ projectId }: { projectId: string }) {
  const { accent } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white font-semibold text-sm transition ml-2 hover:opacity-90"
        style={{ background: `var(--tw-color-accent-${accent})` }}
        onClick={() => setOpen(true)}
        title="Add Update"
      >
        <Plus className="w-4 h-4" />
        Add Update
      </button>
      <AddUpdateModal
        open={open}
        onClose={() => setOpen(false)}
        projectId={projectId}
        onCreated={() => setOpen(false)}
      />
    </>
  );
}