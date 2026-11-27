/**
 * Stackra file contract:
 * Purpose: proves `loadTier`: it keeps the member's own settings, replaces the unit tier's include and exclude with the
 *          load glob, runs one file and one test at a time with no retry, and lifts the timeouts to a soak's length.
 * Boundary: test only; reads the config object, runs no project.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decisions 1 and 4); STA-317.
 */
import { describe, expect, it } from "vitest";

import { LOAD_TEST_TIMEOUT_MS, LOAD_TESTS, loadTier } from "../load.ts";

describe("loadTier", () => {
  it("runs only the load tier and keeps the member's setup", () => {
    const config = loadTier({
      root: "/pkg",
      test: {
        include: ["src/**/__tests__/**/*.test.ts"],
        exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
        setupFiles: [".stackra/vitest.setup.ts"],
        testTimeout: 30_000,
        retry: 2,
      },
    });

    expect(config.root).toBe("/pkg");
    expect(config.test?.setupFiles).toEqual([".stackra/vitest.setup.ts"]);
    expect(config.test?.include).toEqual([...LOAD_TESTS]);
    expect(config.test?.exclude).not.toContain("**/*.{int,contract,e2e,load}.test.ts");
  });

  it("runs one soak at a time, never retries one and gives it a soak's timeouts", () => {
    const config = loadTier({ test: { testTimeout: 30_000, hookTimeout: 60_000, retry: 2 } });

    expect(config.test?.fileParallelism).toBe(false);
    expect(config.test?.maxConcurrency).toBe(1);
    expect(config.test?.retry).toBe(0);
    expect(config.test?.testTimeout).toBe(LOAD_TEST_TIMEOUT_MS);
    expect(config.test?.hookTimeout).toBe(LOAD_TEST_TIMEOUT_MS);
    expect(LOAD_TEST_TIMEOUT_MS).toBeGreaterThanOrEqual(3_600_000);
  });

  it("matches only `.load.test` files in a __tests__ folder", () => {
    expect(LOAD_TESTS).toEqual(["src/**/__tests__/**/*.load.test.{ts,tsx}"]);
  });
});
