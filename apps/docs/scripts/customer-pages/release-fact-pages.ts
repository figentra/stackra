/**
 * Stackra file contract:
 * Purpose: `releaseFactPages`, the pages the release-facts check covers: every customer page
 *          (`src/docs/customers/*.mdx`) and the release runbook.
 * Boundary: lists files; reads none.
 * Runtime: node
 * Governing contract: ADR 0013; STA-1575; STA-2847.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { DOCS_PAGES } from "#scripts/customer-pages/docs-pages";

/**
 * The covered pages.
 *
 * @param root - the pages folder; defaults to `src/docs`.
 * @returns paths relative to `root`, sorted.
 * @example
 * releaseFactPages(); // ["customers/changelog.mdx", …, "runbooks/release.mdx"]
 */
export function releaseFactPages(root: string = DOCS_PAGES): string[] {
  const customers = readdirSync(join(root, "customers"))
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => `customers/${file}`);
  return [...customers, "runbooks/release.mdx"].toSorted();
}
