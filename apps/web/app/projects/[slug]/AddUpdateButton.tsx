"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddUpdateModal from "./AddUpdateModal";

export default function AddUpdateButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm mb-4"
        onClick={() => setOpen(true)}
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