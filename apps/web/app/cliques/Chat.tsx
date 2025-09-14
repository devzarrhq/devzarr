// ... (rest of the file unchanged)

  async function handleCommand(cmd: string) {
    // /help
    if (cmd.trim() === "/help") {
      setShowHelp(true);
      return;
    }

    // /topic <new topic>
    if (cmd.startsWith("/topic ")) {
      // ... (topic logic as before)
    }

    // /mode @handle +v/-v/+m/-m/+o/-o/+t/-t
    if (cmd.startsWith("/mode ")) {
      const parts = cmd.split(" ");
      if (parts.length < 3) {
        setToast("Usage: /mode @user +v|-v|+m|-m|+o|-o|+t|-t");
        return;
      }
      const handle = parts[1];
      const mode = parts[2];
      const { user, role } = await getCurrentUserAndRole();
      if (!user) {
        setToast("You must be signed in.");
        return;
      }
      // Only owner can transfer ownership
      if (["+o", "-o"].includes(mode) && role !== "owner") {
        setToast("Only the owner can transfer ownership.");
        return;
      }
      // Only owner/mod can set other modes
      if (!["owner", "moderator"].includes(role)) {
        setToast("Only owners or moderators can change modes.");
        return;
      }
      const targetUserId = await getUserIdByHandle(handle);
      if (!targetUserId) {
        setToast(`No user with handle ${handle} found.`);
        return;
      }
      if (user.id === targetUserId) {
        setToast("You cannot perform this action on yourself.");
        return;
      }
      // Get target's current role
      const { data: targetMember } = await supabase
        .from("clique_members")
        .select("role, voice")
        .eq("clique_id", cliqueId)
        .eq("user_id", targetUserId)
        .single();
      if (!targetMember) {
        setToast("User is not a member of this clique.");
        return;
      }
      // Handle modes
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
      if (mode === "+t") {
        await supabase
          .from("cliques")
          .update({ topic_locked: true })
          .eq("id", cliqueId);
        setToast("Topic lock enabled (+t). Only mods/ops can change topic.");
        return;
      }
      if (mode === "-t") {
        await supabase
          .from("cliques")
          .update({ topic_locked: false })
          .eq("id", cliqueId);
        setToast("Topic lock disabled (-t). Anyone can change topic.");
        return;
      }
      if (mode === "+v") {
        if (targetMember.voice) {
          setToast("User already has voice.");
          return;
        }
        await supabase
          .from("clique_members")
          .update({ voice: true })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        setToast("User given voice (+v).");
        forceMemberListRefresh();
        return;
      }
      if (mode === "-v") {
        if (!targetMember.voice) {
          setToast("User does not have voice.");
          return;
        }
        await supabase
          .from("clique_members")
          .update({ voice: false })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        setToast("Voice removed (-v).");
        forceMemberListRefresh();
        return;
      }
      if (mode === "+o") {
        // Transfer ownership: set target to owner, current owner to member
        await supabase
          .from("clique_members")
          .update({ role: "owner" })
          .eq("clique_id", cliqueId)
          .eq("user_id", targetUserId);
        await supabase
          .from("clique_members")
          .update({ role: "member" })
          .eq("clique_id", cliqueId)
          .eq("user_id", user.id);
        // Update owner_id in cliques table
        await supabase
          .from("cliques")
          .update({ owner_id: targetUserId })
          .eq("id", cliqueId);
        setToast("Ownership transferred.");
        forceMemberListRefresh();
        return;
      }
      if (mode === "-o") {
        setToast("Cannot demote owner without transferring ownership.");
        return;
      }
      setToast("Unknown mode.");
      return;
    }

    setToast("Unknown command.");
  }