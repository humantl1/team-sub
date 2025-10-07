import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Narrow interface that captures only the Supabase-related keys we care about. Keeping it separate
 * makes the helper functions easy to test by passing in fake env maps instead of relying on
 * `import.meta.env` directly.
 */
type SupabaseEnv = Pick<ImportMetaEnv, "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY">;

/**
 * Module-level cache so every caller reuses the same browser client. Supabase maintains internal
 * state (auth tokens, listeners, etc.), and recreating the client repeatedly would sever those
 * connections and create multiple websocket subscriptions unnecessarily.
 */
let client: SupabaseClient | null = null;

/**
 * Build a Supabase client from the provided env map. Keeping this logic in a pure function makes it
 * easy to unit test the guard rails around missing configuration while still reusing it inside the
 * production singleton.
 */
export function createSupabaseClientFromEnv(env: SupabaseEnv): SupabaseClient {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "VITE_SUPABASE_URL is not defined. Add it to your .env.local before running the app.",
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "VITE_SUPABASE_ANON_KEY is not defined. Add it to your .env.local before running the app.",
    );
  }

  const isTestEnv = import.meta.env.MODE === "test";
  /**
   * Generate a deterministic storage key during Vitest runs so GoTrue does not complain about
   * multiple clients sharing the same underlying storage. Older runtimes (or certain jsdom
   * versions) omit the Web Crypto API, so we defensively fall back to `Math.random` when
   * `crypto.randomUUID` is unavailable instead of throwing a `ReferenceError`.
   */
  const storageKeyForTests = isTestEnv
    ? `sb-test-${
        typeof globalThis.crypto?.randomUUID === "function"
          ? globalThis.crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      }`
    : undefined;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      /**
       * Enabling persistent sessions ensures the browser keeps a user signed in across reloads so
       * the app can hydrate quickly. Supabase refreshes tokens automatically when this flag is true.
       */
      persistSession: true,
      autoRefreshToken: true,
      /**
       * Vitest executes all suites within a single jsdom instance. Generating a unique storage key
       * during test runs prevents Supabase's GoTrue client from emitting "multiple client" warnings
       * when helpers (or the app) create more than one client in the same browser context.
       */
      ...(storageKeyForTests ? { storageKey: storageKeyForTests } : {}),
    },
  });
}

/**
 * Public accessor that lazily builds (and memoizes) the Supabase client using the real environment
 * variables. Future features should import this helper rather than calling `createClient` directly.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createSupabaseClientFromEnv(import.meta.env);
  }

  return client;
}

/**
 * Testing helper: Vitest runs in a single process, so cached clients would leak between cases. Tests
 * can call this helper inside `afterEach` to wipe the singleton and start fresh.
 */
export function __resetSupabaseClientForTesting(): void {
  client = null;
}
