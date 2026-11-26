/**
 * Stackra file contract:
 * Purpose: `writePackageIndex` regenerates the customer package index (`src/docs/customers/packages.mdx`) from the
 *          repository's published packages. Run as `node apps/docs/scripts/package-index/write-package-index.ts` from
 *          any folder after adding, renaming or changing a package, and commit the page; `--check` writes nothing and
 *          exits 1 when the page is stale. Node strips the types; the other modules are imported through the
 *          `#scripts/*` map of package.json, so Node finds them without a written extension.
 * Boundary: writes one page; collecting is `collectPackageIndex`, rendering is `renderPackageIndex`, the comparison is
 *           `checkPackageIndex`.
 * Runtime: node
 * Governing contract: ADR 0453 (amendment 2026-10-27: the stackra package fields); ADR 0002 (2026-10-27 amendment);
 *                     STA-2847.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { checkPackageIndex } from "#scripts/package-index/check-package-index";
import { collectPackageIndex } from "#scripts/package-index/collect-package-index";
import { PACKAGE_INDEX_PAGE } from "#scripts/package-index/package-index-page";
import { renderPackageIndex } from "#scripts/package-index/render-package-index";

/**
 * Regenerates the package index page.
 *
 * @param root - the repository root; defaults to this repository.
 * @param page - the page to write; defaults to `src/docs/customers/packages.mdx`.
 * @returns the number of packages listed.
 * @example
 * writePackageIndex(); // 119
 */
export function writePackageIndex(root?: string, page: string = PACKAGE_INDEX_PAGE): number {
  const records = collectPackageIndex(root);
  writeFileSync(page, renderPackageIndex(records));
  return records.length;
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!process.argv.includes("--check"))
    process.stdout.write(`packages.mdx lists ${writePackageIndex()} packages\n`);
  else if (checkPackageIndex()) process.stdout.write("packages.mdx is current\n");
  else {
    process.stderr.write(
      "packages.mdx is stale: run node apps/docs/scripts/package-index/write-package-index.ts and commit it\n",
    );
    process.exitCode = 1;
  }
}
