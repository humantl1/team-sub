/// <reference types="vite/client" />

/**
 * Declaring the shape of `import.meta.env` gives us strong typing wherever we read environment values.
 * Without these declarations TypeScript would treat each lookup as `any`, which makes typos or missing
 * variables harder to notice until runtime.
 */
interface ImportMetaEnv {
  /**
   * Public URL for the Supabase project (e.g. https://xyzcompany.supabase.co). Supabase provides this
   * in the project dashboard under Settings → API.
   */
  readonly VITE_SUPABASE_URL: string;
  /**
   * Anonymous client key used by the browser application. Even though Supabase labels it "anon", treat
   * it like a credential and keep it out of version control. Copy it from the Supabase dashboard when
   * setting up `.env.local`.
   */
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
