"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ChevronRight } from "lucide-react";

// ... (other utility functions)

export default function Chat({ cliqueId, topic }: { cliqueId: string, topic?: string }) {
  const supabase = supabaseBrowser();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(topic || "");
  const scroller = useRef<HTMLDivElement>(null);

  // ... (useEffect and other logic)

  // --- handleCommand must be here, inside the component ---
  async function handleCommand(cmd: string) {
    if (cmd.trim() === "/help") {
      setShowHelp(true);
      return;
    }
    // ... rest of command logic (as previously provided)
  }

  // ... rest of component (send, render, etc.)
}