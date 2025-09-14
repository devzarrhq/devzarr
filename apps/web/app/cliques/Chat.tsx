// ... (rest of the file unchanged, only update handleCommand and send)

      if (mode === "+m") {
        await supabase
          .from("cliques")
          .update({ moderated: true })
          .eq("id", cliqueId);
        setToast("Moderated chat enabled (+m). Only ops/mods/voice can talk.");
        return;
      }
      if (mode === "-m") {
        await supabase
          .from("cliques")
          .update({ moderated: false })
          .eq("id", cliqueId);
        setToast("Moderated chat disabled (-m). Anyone can talk.");
        return;
      }

// ... in send()
  const send = async () => {
    if (!text.trim()) return;
    if (text.trim().startsWith("/")) {
      await handleCommand(text.trim());
      setText("");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Sign in first");

    // Check if moderated
    const { data: clique } = await supabase
      .from("cliques")
      .select("moderated")
      .eq("id", cliqueId)
      .single();
    if (clique?.moderated) {
      // Check if user is owner, moderator, or has voice
      const { data: member } = await supabase
        .from("clique_members")
        .select("role, voice")
        .eq("clique_id", cliqueId)
        .eq("user_id", user.id)
        .single();
      if (!member || (member.role !== "owner" && member.role !== "moderator" && !member.voice)) {
        setToast("This clique is moderated. Only ops, mods, or users with +v can talk.");
        return;
      }
    }

    const { error } = await supabase.from("messages").insert({
      clique_id: cliqueId,
      author_id: user.id,
      body: text.trim(),
    });
    if (!error) setText("");
  };