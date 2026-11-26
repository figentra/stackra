/**
 * Stackra file contract:
 * Purpose: `renderApiReference(packages)`, every generated page of the API reference keyed by its path under
 *          `src/docs`: the package index and the reference pages of every package.
 * Boundary: pure; `write-api-reference.ts` writes or checks what it returns.
 * Runtime: node
 * Governing contract: ADR 0514 (Fumadocs MDX pages); STA-2857.
 */
import type { ApiPackage } from "#scripts/api-reference/api-package.type";
import { INDEX_PAGE } from "#scripts/api-reference/index-page.constant";
import { renderPackageIndex } from "#scripts/api-reference/render-package-index.function";
import { renderReferencePages } from "#scripts/api-reference/render-reference-pages.function";

/**
 * Every generated page.
 *
 * @param packages - every published package with its symbols.
 * @returns the pages keyed by their path under `src/docs` (`customers/reference/money.mdx`), index first.
 * @example
 * [...renderApiReference(packages).keys()][0]; // "customers/packages.mdx"
 */
export function renderApiReference(packages: readonly ApiPackage[]): Map<string, string> {
  const pages = new Map<string, string>([[INDEX_PAGE, renderPackageIndex(packages)]]);
  for (const pkg of packages) {
    for (const page of renderReferencePages(pkg)) pages.set(page.path, page.content);
  }
  return pages;
}
