/**
 * Stackra file contract:
 * Purpose: `hasIntTests(root)`, whether a member has an authored `<subject>.int.test.ts(x)` in a `__tests__/` folder
 *          under `src/`, which is what makes gen write `.stackra/vitest.int.config.ts`.
 * Boundary: reads folder listings under `<root>/src` only.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 1: test tiers); ADR 0022 (test placement); STA-1819.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** An integration test file inside a `__tests__/` folder, at any depth below it. */
const INT_TEST = /(^|[\\/])__tests__[\\/](.*[\\/])?[^\\/]+\.int\.test\.tsx?$/;

/**
 * Whether `root` has an integration test.
 *
 * @param root - the member root.
 * @example
 * hasIntTests("/repo/services/demo"); // true when src/**\/__tests__/x.int.test.ts exists
 */
export function hasIntTests(root: string): boolean {
  const src = join(root, "src");
  return (
    existsSync(src) &&
    readdirSync(src, { recursive: true }).some((entry) => INT_TEST.test(String(entry)))
  );
}
