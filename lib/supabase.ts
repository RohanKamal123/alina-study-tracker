import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Environment values are trimmed before use: pasting into a hosting dashboard
 * very easily carries a trailing newline or space, and the resulting failure
 * surfaces as a bare "TypeError: Failed to fetch" with nothing pointing at the
 * cause.
 */
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

/**
 * A human-readable reason the credentials cannot be used, or null when they
 * are fine. Checked up front so a misconfiguration is reported as a sentence
 * rather than as a network error at the first sync.
 */
export const configError: string | null = (() => {
  // Neither set: cloud sync is simply switched off, which is a valid state.
  if (!rawUrl && !rawKey) return null;

  if (!rawUrl) return "NEXT_PUBLIC_SUPABASE_URL is missing.";
  if (!rawKey) return "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.";

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return `NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${rawUrl}".`;
  }

  if (parsed.protocol !== "https:") {
    return `NEXT_PUBLIC_SUPABASE_URL must start with https:// — it is "${parsed.protocol}//".`;
  }

  // The .com / .co mix-up is the easiest typo to make and the hardest to spot.
  if (!parsed.hostname.endsWith(".supabase.co")) {
    return `NEXT_PUBLIC_SUPABASE_URL points at "${parsed.hostname}". A Supabase project URL ends in .supabase.co — check for a typo such as .supabase.com.`;
  }

  if (!rawKey.startsWith("eyJ")) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY does not look like a Supabase key. Copy the 'anon public' key from Project Settings → API.";
  }

  return null;
})();

/** True when the deployment has usable Supabase credentials. */
export const cloudConfigured = Boolean(rawUrl && rawKey && !configError);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!cloudConfigured) return null;
  if (!client) {
    client = createClient(rawUrl, rawKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
