import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetSupabaseClientForTesting,
  createSupabaseClientFromEnv,
  getSupabaseClient,
} from "./supabase";

const validEnv = {
  VITE_SUPABASE_URL: "https://example.supabase.co",
  VITE_SUPABASE_ANON_KEY: "dummy-anon-key",
} as const;

afterEach(() => {
  // Each test should start with a clean slate so memoized clients or stubbed env vars do not leak.
  __resetSupabaseClientForTesting();
  vi.unstubAllEnvs();
});

describe("createSupabaseClientFromEnv", () => {
  it("creates a Supabase client when all variables are present", () => {
    const client = createSupabaseClientFromEnv(validEnv);

    // `supabase-js` exposes an `auth` namespace with helper methods; checking for one proves creation succeeded.
    expect(client.auth).toBeDefined();
  });

  it("throws a descriptive error when the Supabase URL is missing", () => {
    expect(() =>
      createSupabaseClientFromEnv({
        ...validEnv,
        // Casting to `any` lets us drop the property during the test without fighting TS about required keys.
        VITE_SUPABASE_URL: "",
      }),
    ).toThrowError(/VITE_SUPABASE_URL/);
  });

  it("throws a descriptive error when the anonymous key is missing", () => {
    expect(() =>
      createSupabaseClientFromEnv({
        ...validEnv,
        VITE_SUPABASE_ANON_KEY: "",
      }),
    ).toThrowError(/VITE_SUPABASE_ANON_KEY/);
  });
});

describe("getSupabaseClient", () => {
  it("memoizes the client so repeated calls reuse the same instance", () => {
    vi.stubEnv("VITE_SUPABASE_URL", validEnv.VITE_SUPABASE_URL);
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", validEnv.VITE_SUPABASE_ANON_KEY);

    const first = getSupabaseClient();
    const second = getSupabaseClient();

    expect(second).toBe(first);
  });
});
