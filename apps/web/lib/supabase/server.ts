import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Only allow reading cookies in server components/pages
export function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Prevent set/remove in server components/pages
        set() {
          // No-op: Only allowed in Server Actions or Route Handlers
        },
        remove() {
          // No-op: Only allowed in Server Actions or Route Handlers
        },
      },
    }
  );
}