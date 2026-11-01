/**
 * Stackra file contract:
 * Purpose: `langAssetsFindings(root)`, the lang-catalogue export check of `stackra validate --repository` (STA-1798): a
 *          package with an `assets/lang/` folder must export `./assets/*` and ship `assets` in `files`, because a host's
 *          generated `.stackra/gen/i18n.ts` imports `@stackra/<pkg>/assets/lang/<locale>/<namespace>.json`, and an
 *          exports map without that subpath blocks it (TS2307 in every consumer).
 * Boundary: reads `packages/<category>/<name>/package.json` and checks for `assets/lang/` only; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 1: catalogues are `assets/lang/<locale>/<namespace>.json`); ADR 0025 (exports).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { sorted } from "#node/functions/sorted.function";
import type { DirFinding } from "#node/types/dir-finding.type";

/** The package folders under `root`: `packages/<category>/<name>`. */
function packageDirs(root: string): string[] {
  const packages = join(root, "packages");
  if (!existsSync(packages)) return [];
  return sorted(
    readdirSync(packages, { withFileTypes: true })
      .filter((category) => category.isDirectory())
      .flatMap((category) =>
        readdirSync(join(packages, category.name), { withFileTypes: true })
          .filter((member) => member.isDirectory())
          .map((member) => `packages/${category.name}/${member.name}`),
      ),
  );
}

/**
 * One finding per package with lang catalogues that does not export or ship them.
 *
 * @example
 * langAssetsFindings(root); // [{ dir: "packages/security/access-log", text: "package.json: exports has no \"./assets/*\" ..." }]
 */
export function langAssetsFindings(root: string): DirFinding[] {
  const findings: DirFinding[] = [];
  for (const dir of packageDirs(root)) {
    const manifestPath = join(root, dir, "package.json");
    if (!existsSync(join(root, dir, "assets/lang")) || !existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      readonly exports?: unknown;
      readonly files?: unknown;
    };
    const exported =
      typeof manifest.exports === "object" &&
      manifest.exports !== null &&
      "./assets/*" in manifest.exports;
    if (!exported)
      findings.push({
        dir,
        text:
          'package.json: exports has no "./assets/*": "./assets/*", so a host\'s generated i18n cannot import its ' +
          "assets/lang catalogues (STA-1798)",
      });
    if (Array.isArray(manifest.files) && !manifest.files.includes("assets"))
      findings.push({
        dir,
        text: 'package.json: files leaves "assets" out, so its assets/lang catalogues do not ship (STA-1798)',
      });
  }
  return findings;
}
