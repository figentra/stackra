/**
 * Stackra file contract:
 * Purpose: `checkReleaseFacts` runs `staleReleaseClaims` over every covered page (the customer pages and the release
 *          runbook). Run as `node apps/docs/scripts/customer-pages/check-release-facts.ts`: it names each stale line
 *          and exits 1; the docs test runs the same check over the committed pages.
 * Boundary: reads pages and reports; it never edits them.
 * Runtime: node
 * Governing contract: ADR 0013; ADR 0453 (decision 18); STA-1575; STA-2847.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { DOCS_PAGES } from "#scripts/customer-pages/docs-pages";
import { releaseFactPages } from "#scripts/customer-pages/release-fact-pages";
import type { StaleReleaseClaim } from "#scripts/customer-pages/stale-release-claim";
import { staleReleaseClaims } from "#scripts/customer-pages/stale-release-claims";

/**
 * Runs the check over the covered pages.
 *
 * @param root - the pages folder; defaults to `src/docs`.
 * @returns every finding on every covered page.
 * @example
 * checkReleaseFacts(); // []
 */
export function checkReleaseFacts(root: string = DOCS_PAGES): StaleReleaseClaim[] {
  return releaseFactPages(root).flatMap((page) =>
    staleReleaseClaims(page, readFileSync(join(root, page), "utf8")),
  );
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  const findings = checkReleaseFacts();
  for (const finding of findings)
    process.stderr.write(`src/docs/${finding.page}:${finding.line}: ${finding.reason}\n`);
  if (findings.length > 0) process.exitCode = 1;
  else process.stdout.write("the customer pages state no stale release fact\n");
}
