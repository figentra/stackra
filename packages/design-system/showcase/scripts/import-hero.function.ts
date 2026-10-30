/**
 * Stackra file contract:
 * Purpose: `importHero`, parse every HeroUI OSS component page (react + native) of a heroui v3 checkout into
 *          `vendor/heroui/<platform>/<slug>.json` and copy HeroUI's MIT LICENSE beside them.
 * Boundary: reads the archive, writes only under the vendor folder it is given.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2; owner answer Q2 (vendor the MIT tables).
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

import { parseHeroMdx } from "./parse-hero-mdx.function.ts";

/** Every `*.mdx` component page under `dir`, except the index. */
function pages(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".mdx") && basename(file) !== "index.mdx")
    .map((file) => join(dir, file))
    .toSorted();
}

/** Imports the archive at `archive` into `vendor` (`.../vendor/heroui`); returns the page count. */
export function importHero(archive: string, vendor: string): number {
  const docs = join(archive, "apps/docs/content/docs");
  let count = 0;
  for (const platform of ["react", "native"] as const) {
    const out = join(vendor, platform);
    mkdirSync(out, { recursive: true });
    for (const file of pages(join(docs, platform, "components"))) {
      const slug = basename(file, ".mdx");
      const doc = parseHeroMdx(readFileSync(file, "utf8"), {
        slug,
        platform,
        source: relative(archive, file),
      });
      writeFileSync(join(out, `${slug}.json`), `${JSON.stringify(doc, null, 2)}\n`);
      count += 1;
    }
  }
  copyFileSync(join(archive, "LICENSE"), join(vendor, "LICENSE"));
  return count;
}
