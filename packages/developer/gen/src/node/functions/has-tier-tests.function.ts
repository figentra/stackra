/**
 * Stackra file contract:
 * Purpose: `hasTierTests(root, tier, generated)`, whether a member has a test of an infixed tier where that tier runs
 *          one (`INT_TESTS` and `CONTRACT_TESTS` of `@stackra/vitest-config`): an authored
 *          `<subject>.<tier>.test.ts(x)` in a `__tests__/` folder under `src/`, or one gen writes this run under
 *          `.stackra/tests/` (the tenant-isolation test, a package's migration check). Either makes gen write
 *          `.stackra/vitest.<tier>.config.ts`.
 * Boundary: reads folder listings under `<root>/src` only; the generated paths come from the caller, since this run's
 *           `.stackra/` output may not be on disk yet.
 * Runtime: node
 * Governing contract: ADR 0182 (decisions 1 and 4: test tiers, the contract tier); ADR 0022 (test placement);
 *                     STA-1819; STA-2837.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** For each tier: a test file inside a `__tests__/` folder at any depth below it, and one gen writes. */
const PATTERNS = {
  int: {
    authored: /(^|[\\/])__tests__[\\/](.*[\\/])?[^\\/]+\.int\.test\.tsx?$/,
    generated: /^\.stackra\/tests\/(.+\/)?[^/]+\.int\.test\.ts$/,
  },
  contract: {
    authored: /(^|[\\/])__tests__[\\/](.*[\\/])?[^\\/]+\.contract\.test\.tsx?$/,
    generated: /^\.stackra\/tests\/(.+\/)?[^/]+\.contract\.test\.ts$/,
  },
} as const;

/**
 * Whether `root` has a test of `tier`.
 *
 * @param root - the member root.
 * @param tier - the infix: `int` or `contract`.
 * @param generated - the member-relative paths gen writes this run.
 * @example
 * hasTierTests("/repo/services/demo", "int"); // true when src/**\/__tests__/x.int.test.ts exists
 * hasTierTests("/repo/services/demo", "int", [".stackra/tests/tenant-isolation.int.test.ts"]); // true
 * hasTierTests("/repo/packages/x/y", "contract"); // true when src/**\/__tests__/x.contract.test.ts exists
 */
export function hasTierTests(
  root: string,
  tier: keyof typeof PATTERNS,
  generated: readonly string[] = [],
): boolean {
  const { authored, generated: written } = PATTERNS[tier];
  if (generated.some((path) => written.test(path))) return true;
  const src = join(root, "src");
  return (
    existsSync(src) &&
    readdirSync(src, { recursive: true }).some((entry) => authored.test(String(entry)))
  );
}
