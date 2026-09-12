import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components in Next.js App Router.
 * Uses public environment variables to connect directly from the browser.
 */
let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-alones-buddy.supabase.co";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-anon-key";

  try {
    browserClient = createBrowserClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.warn("[Supabase] Failed to initialize browser client, continuing in offline mode:", err);
    browserClient = createBrowserClient("https://placeholder-alones-buddy.supabase.co", "placeholder-anon-key");
  }
  return browserClient;
}
