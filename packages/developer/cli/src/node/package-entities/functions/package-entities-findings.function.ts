/**
 * Stackra file contract:
 * Purpose: `packageEntitiesFindings(root)`, the package entity-list check of `stackra validate --repository`
 *          (STA-1793): a package whose committed manifest lists models of its own must export `<MEMBER>_ENTITIES` from
 *          its `./node` entry, because gen's `.stackra/gen/registrations.ts` of every hosting service imports that name
 *          to register the package's entities. A stand-in barrel (`src/node/index.ts`) re-exports it from
 *          `#stackra/entities/<member>`, as gen's own barrels do.
 * Boundary: reads `packages/<category>/<name>/stackra.manifest.json` and `src/node/index.ts` only; writes nothing. A
 *           package with no own models, or with no stand-in barrel (gen writes its entries), is not checked.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15: the entries); ADR 0158 (a package ships its manifest).
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
 * One finding per package whose own models are listed in its manifest but whose stand-in `./node` barrel does not
 * export `<MEMBER>_ENTITIES`.
 *
 * @example
 * packageEntitiesFindings(root); // [{ dir: "packages/security/scope", text: "src/node/index.ts: export SCOPE_ENTITIES ..." }]
 */
export function packageEntitiesFindings(root: string): DirFinding[] {
  const findings: DirFinding[] = [];
  for (const dir of packageDirs(root)) {
    const manifestPath = join(root, dir, "stackra.manifest.json");
    const barrelPath = join(root, dir, "src/node/index.ts");
    if (!existsSync(manifestPath) || !existsSync(barrelPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      readonly member?: unknown;
      readonly models?: readonly { readonly from?: unknown }[];
    };
    const own = (manifest.models ?? []).some((model) => model.from === undefined);
    if (!own || typeof manifest.member !== "string") continue;
    const name = `${manifest.member.toUpperCase()}_ENTITIES`;
    if (!new RegExp(`\\bexport\\s*\\{[^}]*\\b${name}\\b`).test(readFileSync(barrelPath, "utf8")))
      findings.push({
        dir,
        text:
          `src/node/index.ts: export ${name} from "#stackra/entities/${manifest.member}", which every hosting ` +
          "service's generated registrations import (STA-1793)",
      });
  }
  return findings;
}
