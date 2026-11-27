/**
 * Stackra file contract:
 * Purpose: `pnpm error-codes:write` (in apps/docs): writes `@stackra/gen`'s `error-codes.constant.ts` from the
 *          error-code reference page, after a row of the page changes, and formats it with the repository's oxfmt.
 * Boundary: reads the page and writes the one catalogue file; prints the count. Never reads the tools' source.
 * Runtime: node
 * Governing contract: STA-2853; STA-2891.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { CATALOGUE_PATHS } from "#scripts/error-codes/catalogue-paths";
import { catalogueEntries } from "#scripts/error-codes/catalogue-entries";
import { renderCatalogue } from "#scripts/error-codes/render-catalogue";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const entries = catalogueEntries(readFileSync(join(root, CATALOGUE_PATHS.page), "utf8"));
writeFileSync(join(root, CATALOGUE_PATHS.catalogue), renderCatalogue(entries));
execFileSync(
  fileURLToPath(new URL("../../node_modules/.bin/oxfmt", import.meta.url)),
  [CATALOGUE_PATHS.catalogue],
  {
    cwd: root,
    stdio: "inherit",
  },
);
process.stdout.write(`wrote ${entries.length} codes to ${CATALOGUE_PATHS.catalogue}\n`);
