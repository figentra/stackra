/**
 * Stackra file contract:
 * Purpose: entry of @figentra/worker-static's build: reads the schemas (working tree and every release tag), plans the site
 *          and writes it to dist/site, the folder wrangler.jsonc serves. `pnpm build` bundles this file with tsdown
 *          and runs dist/main.mjs.
 * Boundary: writes only dist/site and one summary line on stdout; never deploys (CI runs `wrangler deploy`).
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files); ADR 0007 (documentation).
 */
import { fileURLToPath } from "node:url";

import { planSite, readSchemaReleases, readWorkingSchemas, writeSite } from "#src/site";

// src/main.ts and the bundled dist/main.mjs both sit two folders below the member, three below the repo root.
const root = fileURLToPath(new URL("../../../", import.meta.url));
const outDir = fileURLToPath(new URL("../dist/site/", import.meta.url));

const files = planSite(readWorkingSchemas(root), readSchemaReleases(root));
writeSite(outDir, files);
process.stdout.write(`@figentra/worker-static: wrote ${files.length} files to dist/site\n`);
