/**
 * Stackra file contract:
 * Purpose: `checkPackageIndex` says whether the committed package index page is exactly what the writer would write
 *          from the repository's packages now (the drift check the docs test and `write-package-index.ts --check` run).
 * Boundary: reads only; never writes the page.
 * Runtime: node
 * Governing contract: ADR 0453 (amendment 2026-10-27); STA-2847.
 */
import { existsSync, readFileSync } from "node:fs";

import { collectPackageIndex } from "#scripts/package-index/collect-package-index";
import { PACKAGE_INDEX_PAGE } from "#scripts/package-index/package-index-page";
import { renderPackageIndex } from "#scripts/package-index/render-package-index";

/**
 * Says whether the committed page is current.
 *
 * @param root - the repository root; defaults to this repository.
 * @param page - the committed page; defaults to `src/docs/customers/packages.mdx`.
 * @returns `true` when the page matches what the writer would write.
 * @example
 * checkPackageIndex(); // true
 */
export function checkPackageIndex(root?: string, page: string = PACKAGE_INDEX_PAGE): boolean {
  return (
    existsSync(page) && readFileSync(page, "utf8") === renderPackageIndex(collectPackageIndex(root))
  );
}
