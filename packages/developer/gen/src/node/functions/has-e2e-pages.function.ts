/**
 * Stackra file contract:
 * Purpose: `hasE2ePages(root)`, whether a package has an end-to-end page: an authored `<name>.e2e.page.tsx` in a
 *          `__tests__/` folder under `src/`. One makes gen write the `.stackra/e2e/` app and
 *          `.stackra/playwright.e2e.config.ts`, so `stackra test --tier e2e` renders the page in a real browser.
 * Boundary: reads folder listings under `<root>/src` only.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement; the 2026-11-09 amendment: package e2e); ADR 0182 (decision 1).
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** An end-to-end page file directly in a `__tests__/` folder. */
const E2E_PAGE = /(^|[\\/])__tests__[\\/][^\\/]+\.e2e\.page\.tsx$/;

/**
 * Whether `root` has an end-to-end page.
 *
 * @param root - the member root.
 * @example
 * hasE2ePages("/repo/packages/ui/button"); // true when src/**\/__tests__/button.e2e.page.tsx exists
 */
export function hasE2ePages(root: string): boolean {
  const src = join(root, "src");
  return (
    existsSync(src) &&
    readdirSync(src, { recursive: true }).some((entry) => E2E_PAGE.test(String(entry)))
  );
}
