/**
 * Stackra file contract:
 * Purpose: `E2E_PAGE_PATTERN`, which file names are a package's e2e page: `.e2e.page.tsx`, the page a Playwright spec
 *          renders in a real browser.
 * Boundary: data only; the test-placement check reads it.
 * Runtime: node
 * Governing contract: ADR 0022 (the 2026-11-09 amendment: package e2e).
 */

/** An e2e page file name. */
export const E2E_PAGE_PATTERN = /\.e2e\.page\.tsx$/;
