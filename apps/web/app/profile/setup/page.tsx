"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../providers/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useTheme } from "../../theme-context";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

// ... (rest of the code unchanged)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit || !user) {
      setError("Handle and display name are required.");
      return;
    }
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const { error: upError } = await supabase
        .from("profiles")
        .update({
          handle: handle.trim(),
          display_name: displayName.trim(),
          avatar_url: avatarUrl.trim() || null,
          background_url: backgroundUrl.trim() || null,
          tagline: tagline.trim() || null,
          location: location.trim() || null,
          bio: bio.trim() || null,
        })
        .eq("user_id", user.id);
      if (upError) throw upError;
      router.refresh(); // <--- This will force all components to re-fetch data
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

// ... (rest of the code unchanged)