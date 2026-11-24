/**
 * Stackra file contract:
 * Purpose: unit tests of `checkVitestPair`: a catalog that pins vitest and its coverage package at one version passes;
 *          a split pair, in one catalog or across two, is one finding naming both; a workspace that pins only one of
 *          them, or neither, has nothing to check.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: the versions rule; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkVitestPair } from "#node/functions/check-vitest-pair.function";

describe("checkVitestPair", () => {
  it("passes a pair pinned at one version", () => {
    const yaml = 'catalogs:\n  quality:\n    vitest: 5.0.5\n    "@vitest/coverage-v8": 5.0.5\n';
    expect(checkVitestPair(yaml)).toEqual([]);
  });

  it("reports a split pair, naming both versions and the version to pin", () => {
    const yaml = 'catalogs:\n  quality:\n    vitest: 5.0.5\n    "@vitest/coverage-v8": 5.0.3\n';
    const findings = checkVitestPair(yaml);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain("vitest 5.0.5 (catalogs.quality)");
    expect(findings[0]).toContain("@vitest/coverage-v8 5.0.3 (catalogs.quality)");
    expect(findings[0]).toContain("pin both at 5.0.5");
  });

  it("reports a split pair across the default catalog and a named one", () => {
    const yaml = 'catalog:\n  vitest: 5.0.5\ncatalogs:\n  old:\n    "@vitest/coverage-v8": 5.0.3\n';
    expect(checkVitestPair(yaml)).toHaveLength(1);
  });

  it("checks nothing when only one of the two is pinned, or neither", () => {
    expect(checkVitestPair("catalog:\n  vitest: 5.0.5\n")).toEqual([]);
    expect(checkVitestPair('catalog:\n  "@vitest/coverage-v8": 5.0.3\n')).toEqual([]);
    expect(checkVitestPair("catalog:\n  oxlint: 1.86.0\n")).toEqual([]);
    expect(checkVitestPair(undefined)).toEqual([]);
  });

  it("passes the repository's own pnpm-workspace.yaml", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const yaml = readFileSync(
      fileURLToPath(new URL("../../../../../../../pnpm-workspace.yaml", import.meta.url)),
      "utf8",
    );
    expect(checkVitestPair(yaml)).toEqual([]);
  });
});
