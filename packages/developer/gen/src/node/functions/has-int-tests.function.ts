/**
 * Stackra file contract:
 * Purpose: `hasIntTests(root, generated)`, whether a member has an integration test where the int tier
 *          (`INT_TESTS` of `@stackra/vitest-config`) runs one: an authored `<subject>.int.test.ts(x)` in a `__tests__/`
 *          folder under `src/`, or one gen writes this run under `.stackra/tests/` (the tenant-isolation test, a
 *          package's migration check). Either makes gen write `.stackra/vitest.int.config.ts`.
 * Boundary: reads folder listings under `<root>/src` only; the generated paths come from the caller, since this run's
 *           `.stackra/` output may not be on disk yet.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 1: test tiers); ADR 0022 (test placement); STA-1819.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** An integration test file inside a `__tests__/` folder, at any depth below it. */
const INT_TEST = /(^|[\\/])__tests__[\\/](.*[\\/])?[^\\/]+\.int\.test\.tsx?$/;

/** A generated integration test, as the int tier's `.stackra/tests/**\/*.int.test.ts` glob matches it. */
const GENERATED_INT_TEST = /^\.stackra\/tests\/(.+\/)?[^/]+\.int\.test\.ts$/;

/**
 * Whether `root` has an integration test.
 *
 * @param root - the member root.
 * @param generated - the member-relative paths gen writes this run.
 * @example
 * hasIntTests("/repo/services/demo"); // true when src/**\/__tests__/x.int.test.ts exists
 * hasIntTests("/repo/services/demo", [".stackra/tests/tenant-isolation.int.test.ts"]); // true
 */
export function hasIntTests(root: string, generated: readonly string[] = []): boolean {
  if (generated.some((path) => GENERATED_INT_TEST.test(path))) return true;
  const src = join(root, "src");
  return (
    existsSync(src) &&
    readdirSync(src, { recursive: true }).some((entry) => INT_TEST.test(String(entry)))
  );
}
