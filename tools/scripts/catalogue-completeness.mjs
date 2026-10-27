#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the catalogue-completeness gate on its own (`node tools/scripts/catalogue-completeness.mjs`; `pnpm validate`
 *          runs it through validate-repository.mjs): a thin wrapper over @stackra/repo-checks (`checkCatalogues`).
 *          `stackra check --only catalogues` runs the same check. Prints the findings and exits 1; prints nothing on
 *          success.
 * Boundary: a thin wrapper; the check itself is @stackra/repo-checks' `checkCatalogues`.
 * Runtime: node
 * Governing contract: ADR 0403 (catalogues and a completeness gate).
 * Scope: every git-listed `assets/lang` JSON file outside the scaffold templates.
 * Owner: code-standards-steward · Secrets: forbidden
 */
import { fileURLToPath } from "node:url";

import { checks } from "./repo-checks.mjs";

export const {
  BASE_LANGUAGES,
  SEVEN_LANGUAGE_MEMBERS,
  keysOf,
  messagesOf,
  placeholdersOf,
  checkCatalogues,
} = checks;

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const findings = checks.catalogueFindings(checks.readRepoContext(ROOT));
  for (const { text } of findings) console.error(text);
  if (findings.length > 0) {
    console.error(`\n${findings.length} catalogue finding(s).`);
    process.exit(1);
  }
}
