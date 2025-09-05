"use client";

import React from "react";
import { Pencil, LogOut, UserCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../providers/AuthProvider";

export default function SettingsMenu({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabaseBrowser().auth.signOut();
    router.replace("/login");
    onClose?.();
  };

  return (
    <div className="p-4 w-56 bg-gray-900 rounded-xl shadow-lg text-gray-100 flex flex-col gap-2">
      <Link
        href="/profile"
        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold transition"
        onClick={onClose}
      >
        <UserCircle className="w-5 h-5" />
        View Profile
      </Link>
      <Link
        href="/profile/setup"
        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
        onClick={onClose}
      >
        <Pencil className="w-5 h-5" />
        Edit Profile
      </Link>
      <button
        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5" />
        Log out
      </button>
    </div>
  );
}