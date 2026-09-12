import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client utilizing SUPABASE_SERVICE_ROLE_KEY.
 * This client bypasses Row-Level Security (RLS).
 * MUST NEVER be exposed to or executed within client/browser components.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient cannot be executed in browser context.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL for server-side admin client."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
