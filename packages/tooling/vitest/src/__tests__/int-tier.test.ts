/**
 * Stackra file contract:
 * Purpose: proves `intTier`: it keeps the member's own settings and replaces the unit tier's include and exclude with
 *          the integration globs, the generated `.stackra/tests` folder included.
 * Boundary: test only; reads the config object, runs no project.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decision 1); STA-1570.
 */
import { describe, expect, it } from "vitest";

import { INT_TESTS, intTier } from "../int.ts";

describe("intTier", () => {
  it("runs only the integration tier and keeps the member's setup", () => {
    const config = intTier({
      root: "/pkg",
      test: {
        include: ["src/**/__tests__/**/*.test.ts"],
        exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
        setupFiles: [".stackra/vitest.setup.ts"],
      },
    });

    expect(config.root).toBe("/pkg");
    expect(config.test?.setupFiles).toEqual([".stackra/vitest.setup.ts"]);
    expect(config.test?.include).toEqual([...INT_TESTS]);
    expect(config.test?.include).toContain(".stackra/tests/**/*.int.test.ts");
    expect(config.test?.exclude).not.toContain("**/*.{int,contract,e2e,load}.test.ts");
    expect(config.test?.fileParallelism).toBe(false);
  });
});
