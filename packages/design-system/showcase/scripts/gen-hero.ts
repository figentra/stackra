/**
 * Stackra file contract:
 * Purpose: `pnpm -F @stackra/showcase hero:import --archive <heroui v3 checkout>`: vendor HeroUI's OSS docs tables
 *          into `vendor/heroui/` (see `importHero`).
 * Boundary: a CLI only; run once per HeroUI upgrade. The archive is never a runtime or build dependency.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2; owner answer Q2.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { importHero } from "./import-hero.function.ts";

const at = process.argv.indexOf("--archive");
const archive = at > 0 ? process.argv[at + 1] : undefined;
if (!archive) {
  console.error("usage: node scripts/gen-hero.ts --archive <heroui v3 checkout>");
  process.exit(2);
}
const vendor = join(dirname(fileURLToPath(import.meta.url)), "../vendor/heroui");
console.log(`hero:import wrote ${importHero(archive, vendor)} pages to ${vendor}`);
