/**
 * Stackra file contract:
 * Purpose: proves `contractTier`: it keeps the member's own settings and replaces the unit tier's include and exclude
 *          with the contract globs, the generated `.stackra/tests` folder included, and leaves file parallelism alone.
 * Boundary: test only; reads the config object, runs no project.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decisions 1 and 4); STA-2837.
 */
import { describe, expect, it } from "vitest";

import { CONTRACT_TESTS, contractTier } from "../contract.ts";

describe("contractTier", () => {
  it("runs only the contract tier and keeps the member's setup", () => {
    const config = contractTier({
      root: "/pkg",
      test: {
        include: ["src/**/__tests__/**/*.test.ts"],
        exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
        setupFiles: [".stackra/vitest.setup.ts"],
        testTimeout: 30_000,
      },
    });

    expect(config.root).toBe("/pkg");
    expect(config.test?.setupFiles).toEqual([".stackra/vitest.setup.ts"]);
    expect(config.test?.testTimeout).toBe(30_000);
    expect(config.test?.include).toEqual([...CONTRACT_TESTS]);
    expect(config.test?.include).toContain("src/**/__tests__/**/*.contract.test.{ts,tsx}");
    expect(config.test?.include).toContain(".stackra/tests/**/*.contract.test.ts");
    expect(config.test?.exclude).not.toContain("**/*.{int,contract,e2e,load}.test.ts");
    expect(config.test?.fileParallelism).toBeUndefined();
  });
});
