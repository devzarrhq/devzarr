import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const { otherUserId } = await req.json();
    if (!otherUserId || typeof otherUserId !== "string") {
      return NextResponse.json({ error: "Missing or invalid user." }, { status: 400 });
    }
    // Call the dm_get_or_create function
    const { data, error } = await supabase
      .rpc("dm_get_or_create", { other_user: otherUserId });
    if (error || !data || !data.id) {
      return NextResponse.json({ error: "Failed to create or fetch DM thread." }, { status: 500 });
    }
    return NextResponse.json({ threadId: data.id });
  } catch (err) {
    return NextResponse.json({ error: "Failed to start conversation." }, { status: 500 });
  }
}