import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  /**
   * Vitest runs every suite in a single jsdom context. Returning a shared mocked client here prevents
   * Supabase's GoTrue from logging "Multiple GoTrueClient instances" warnings while still letting us
   * assert the options we pass into `createClient`.
   */
  createClient: vi.fn(),
}));

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
const mockedCreateClient = vi.mocked(createClient);

// Reuse the strongly typed database schema so our tests verify the same surface area as production.
import type { Database } from "./supabase.types";

import {
  __resetSupabaseClientForTesting,
  createSupabaseClientFromEnv,
  getSupabaseClient,
} from "./supabase";

const validEnv = {
  VITE_SUPABASE_URL: "https://example.supabase.co",
  VITE_SUPABASE_ANON_KEY: "dummy-anon-key",
} as const;

beforeEach(() => {
  mockedCreateClient.mockImplementation(
    () =>
      ({
        auth: {
          signOut: vi.fn(),
          onAuthStateChange: vi.fn(),
          getSession: vi.fn(),
        },
      }) as unknown as SupabaseClient<Database>,
  );
});

afterEach(() => {
  // Each test should start with a clean slate so memoized clients or stubbed env vars do not leak.
  __resetSupabaseClientForTesting();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  mockedCreateClient.mockReset();
});

describe("createSupabaseClientFromEnv", () => {
  it("creates a Supabase client when all variables are present", () => {
    const client = createSupabaseClientFromEnv(validEnv);

    // `supabase-js` exposes an `auth` namespace with helper methods; checking for one proves creation succeeded.
    expect(client.auth).toBeDefined();
    expect(mockedCreateClient).toHaveBeenCalledWith(
      validEnv.VITE_SUPABASE_URL,
      validEnv.VITE_SUPABASE_ANON_KEY,
      expect.objectContaining({
        auth: expect.objectContaining({
          persistSession: true,
          autoRefreshToken: true,
          storageKey: expect.stringMatching(/^sb-test-/),
        }),
      }),
    );
  });

  it("falls back to Math.random when `crypto.randomUUID` is unavailable", () => {
    const randomValue = 0.123456789;
    const expectedSuffix = randomValue.toString(36).slice(2);
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(randomValue);

    // Simulate a runtime that lacks the Web Crypto API so the helper exercises its Math.random
    // fallback path without crashing.
    vi.stubGlobal("crypto", undefined);

    try {
      createSupabaseClientFromEnv(validEnv);

      expect(mockedCreateClient).toHaveBeenCalledWith(
        validEnv.VITE_SUPABASE_URL,
        validEnv.VITE_SUPABASE_ANON_KEY,
        expect.objectContaining({
          auth: expect.objectContaining({
            persistSession: true,
            autoRefreshToken: true,
            storageKey: `sb-test-${expectedSuffix}`,
          }),
        }),
      );
      expect(randomSpy).toHaveBeenCalledTimes(1);
    } finally {
      randomSpy.mockRestore();
    }
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
    expect(mockedCreateClient).toHaveBeenCalledTimes(1);
  });
});
