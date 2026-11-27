/**
 * Stackra file contract:
 * Purpose: `hasLoadTests(root)`, whether a member has a load test where the load tier (`LOAD_TESTS` of
 *          `@stackra/vitest-config`) runs one: an authored `<subject>.load.test.ts(x)` in a `__tests__/` folder under
 *          `src/`. It makes gen write `.stackra/vitest.load.config.ts`.
 * Boundary: reads folder listings under `<root>/src` only; gen writes no load test, so nothing generated counts.
 * Runtime: node
 * Governing contract: ADR 0182 (decisions 1 and 4: the load tier); ADR 0022 (test placement); STA-317.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** A load test file inside a `__tests__/` folder, at any depth below it. */
const LOAD_TEST = /(^|[\\/])__tests__[\\/](.*[\\/])?[^\\/]+\.load\.test\.tsx?$/;

/**
 * Whether `root` has a load test.
 *
 * @param root - the member root.
 * @example
 * hasLoadTests("/repo/packages/runtime/queue"); // true when src/**\/__tests__/x.load.test.ts exists
 */
export function hasLoadTests(root: string): boolean {
  const src = join(root, "src");
  return (
    existsSync(src) &&
    readdirSync(src, { recursive: true }).some((entry) => LOAD_TEST.test(String(entry)))
  );
}
