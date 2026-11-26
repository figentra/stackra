/**
 * Stackra file contract:
 * Purpose: proves the coverage floors of ADR 0182: every member gets 80/80/70, the packages it names get 90/90/80,
 *          `withCoverage` picks the floor from the member's package.json (its `root`, else the working directory), a
 *          documented override still wins, and every `packages/security/*` package is on the strict list.
 * Boundary: test only; writes throwaway package.json files under the OS temp directory and reads the repository's
 *           `packages/security` folder names.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decision 2: coverage floors); ADR 0022 (test placement).
 */
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";
import type { ViteUserConfig } from "vitest/config";

import * as entry from "../coverage.ts";
import { libraryPreset } from "../index.ts";

const { COVERAGE_THRESHOLDS, STRICT_COVERAGE_PACKAGES, coverageThresholdsFor, withCoverage } =
  entry;

/** A fresh member root whose package.json carries `name` (no package.json when `name` is undefined). */
function memberRoot(name?: string): string {
  const root = mkdtempSync(join(tmpdir(), "coverage-floor-"));
  if (name !== undefined) writeFileSync(join(root, "package.json"), JSON.stringify({ name }));
  return root;
}

/** The thresholds `withCoverage` sets on a config rooted at `root`. */
const thresholdsAt = (root: string): unknown =>
  withCoverage<ViteUserConfig>({ root, test: {} }).test?.coverage?.thresholds;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("coverage floors (ADR 0182 decision 2)", () => {
  it("are 80/80/70 for every member and 90/90/80 for the strict group", () => {
    expect(COVERAGE_THRESHOLDS).toEqual({ lines: 80, functions: 80, branches: 70 });
    expect(entry.STRICT_COVERAGE_THRESHOLDS).toEqual({ lines: 90, functions: 90, branches: 80 });
    expect(coverageThresholdsFor("@stackra/cache")).toEqual(COVERAGE_THRESHOLDS);
    expect(coverageThresholdsFor(undefined)).toEqual(COVERAGE_THRESHOLDS);
    for (const name of [
      "@stackra/tenancy",
      "@stackra/iam",
      "@stackra/actions",
      "@stackra/outbox",
      "@stackra/workflow",
      "@stackra/versioning",
      "@stackra/validation",
      "@stackra/licensing",
    ]) {
      expect(coverageThresholdsFor(name), name).toEqual({ lines: 90, functions: 90, branches: 80 });
    }
  });

  it("holds every packages/security package to the strict floor", () => {
    const security = fileURLToPath(new URL("../../../../security", import.meta.url));
    const names = readdirSync(security, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map(
        (dirent) =>
          (
            JSON.parse(readFileSync(join(security, dirent.name, "package.json"), "utf8")) as {
              name: string;
            }
          ).name,
      );
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(STRICT_COVERAGE_PACKAGES, name).toContain(name);
  });

  it("withCoverage reads the floor from the member root's package.json", () => {
    expect(thresholdsAt(memberRoot("@stackra/iam"))).toEqual({
      lines: 90,
      functions: 90,
      branches: 80,
    });
    expect(thresholdsAt(memberRoot("@stackra/cache"))).toEqual(COVERAGE_THRESHOLDS);
    expect(thresholdsAt(memberRoot())).toEqual(COVERAGE_THRESHOLDS);
  });

  it("withCoverage falls back to the working directory a test:coverage script runs in", () => {
    vi.spyOn(process, "cwd").mockReturnValue(memberRoot("@stackra/outbox"));
    expect(withCoverage<ViteUserConfig>({ test: {} }).test?.coverage?.thresholds).toEqual({
      lines: 90,
      functions: 90,
      branches: 80,
    });
  });

  it("lets a member's documented override lower one threshold and keeps the rest of its floor", () => {
    const config = withCoverage<ViteUserConfig>(
      { root: memberRoot("@stackra/tenancy"), test: {} },
      { thresholds: { branches: 75 }, exclude: ["src/legacy/**"] },
    );
    expect(config.test?.coverage?.thresholds).toEqual({ lines: 90, functions: 90, branches: 75 });
    expect(config.test?.coverage).toMatchObject({ provider: "v8", enabled: false });
    const coverage = config.test?.coverage as { exclude?: string[] } | undefined;
    expect(coverage?.exclude).toContain("src/legacy/**");
  });

  it("puts a strict package's libraryPreset under the strict floor", () => {
    const thresholds = libraryPreset({ root: memberRoot("@stackra/workflow") }).test?.coverage
      ?.thresholds;
    expect(thresholds).toEqual({ lines: 90, functions: 90, branches: 80 });
  });
});
