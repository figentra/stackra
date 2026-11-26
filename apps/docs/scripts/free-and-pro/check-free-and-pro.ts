/**
 * Stackra file contract:
 * Purpose: `checkFreeAndPro` runs `freeAndProFindings` over the committed "Free and Pro" page
 *          (`src/docs/customers/free-and-pro.mdx`) with the repository's published packages and the 0461 Pro list.
 *          Run as `node apps/docs/scripts/free-and-pro/check-free-and-pro.ts`: it names each finding and exits 1;
 *          the docs test runs the same check.
 * Boundary: reads the page and the packages' package.json files and reports; it never edits the page.
 * Runtime: node
 * Governing contract: ADR 0461 (decisions 1 and 2); STA-2865.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { FreeAndProFinding } from "#scripts/free-and-pro/free-and-pro-finding";
import { freeAndProFindings } from "#scripts/free-and-pro/free-and-pro-findings";
import { FREE_AND_PRO_PAGE } from "#scripts/free-and-pro/free-and-pro-page";
import { PRO_PACKAGES } from "#scripts/free-and-pro/pro-packages";
import { publishedPackages } from "#scripts/free-and-pro/published-packages";

/** The repository root, four folders above this file (apps/docs/scripts/free-and-pro). */
const REPOSITORY = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

/**
 * Checks the committed page.
 *
 * @param root - the repository root; defaults to this repository.
 * @returns the findings; empty when the page is right.
 * @example
 * checkFreeAndPro(); // []
 */
export function checkFreeAndPro(root: string = REPOSITORY): FreeAndProFinding[] {
  return freeAndProFindings(
    readFileSync(join(root, FREE_AND_PRO_PAGE), "utf8"),
    publishedPackages(join(root, "packages")),
    PRO_PACKAGES,
  );
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  const findings = checkFreeAndPro();
  for (const { line, reason } of findings)
    process.stderr.write(
      `${FREE_AND_PRO_PAGE}${line === undefined ? "" : `:${line}`}: ${reason}\n`,
    );
  if (findings.length > 0) process.exitCode = 1;
  else
    process.stdout.write("the Free and Pro page names only real packages and the whole Pro list\n");
}
