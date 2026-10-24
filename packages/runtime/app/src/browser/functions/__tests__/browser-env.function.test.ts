/**
 * Stackra file contract:
 * Purpose: unit tests of `browserEnv`: it returns the bundler's env object, so a public variable the build inlined is
 *          read from it.
 * Boundary: test only; vitest's `import.meta.env` stands in for the bundler's, stubbed with `vi.stubEnv`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 4).
 */
import { afterEach, describe, expect, it, vi } from "@stackra/testing";

import { browserEnv } from "#browser/functions/browser-env.function";

describe("browserEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the bundler's env object", () => {
    vi.stubEnv("VITE_API_ORIGIN", "https://api.example.com");
    expect(browserEnv()["VITE_API_ORIGIN"]).toBe("https://api.example.com");
  });
});
