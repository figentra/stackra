/**
 * Stackra file contract:
 * Purpose: `readServiceCatalogues`, discovery's read of the lang catalogues of each service the member consumes through
 *          a client (`#stackra/clients/<service>`): the service folder's `assets/lang/<locale>/<namespace>.json`, so an
 *          app's `I18n.orders.*` resolves to the commerce service's `orders` namespace, as the template promises
 *          ("gen merges consumed services' lang into .stackra/lang/", STA-1363).
 * Boundary: reads only the `assets/lang` of a consumed service found beside the member, or for an app in the repo's
 *           `services/` (the folders `readServiceManifests` matched); writes nothing. Each set carries the service's
 *           package name as its owner and its lang folder relative to the member root, which the catalogue loaders
 *           import from `.stackra/gen/i18n.ts`. A service without the folder is skipped; an invalid catalogue throws.
 * Runtime: node
 * Governing contract: ADR 0080 (as amended by 0305 conventions 1); ADR 0268 (R15: typed keys); ADR 0260 (decision 3:
 *                     what a member consumes through a client); STA-1298; STA-1363.
 */
import { existsSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

import type { MemberIR } from "#core/types/member-ir.type";
import { readCatalogues } from "#node/functions/read-catalogues.function";

/**
 * The catalogues of each consumed service that ships `assets/lang`, sorted by service key.
 *
 * @param root - the member root.
 * @param services - the consumed services discovery found (`MemberIR.services`).
 * @throws Error when a catalogue is not valid JSON.
 * @example
 * readServiceCatalogues("/repo/apps/console", ir.services ?? [])[0]?.from; // "../../services/commerce/assets/lang"
 */
export function readServiceCatalogues(
  root: string,
  services: NonNullable<MemberIR["services"]>,
): NonNullable<MemberIR["packageCatalogues"]> {
  const parents = [...new Set([dirname(root), join(dirname(dirname(root)), "services")])];
  const found: NonNullable<MemberIR["packageCatalogues"]>[number][] = [];
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  for (const service of [...services].sort((left, right) =>
    left.member.localeCompare(right.member),
  )) {
    const folder = parents
      .map((parent) => join(parent, service.folder ?? service.member))
      .find((candidate) => existsSync(join(candidate, "stackra.manifest.json")));
    const catalogues = folder === undefined ? undefined : readCatalogues(folder);
    if (folder === undefined || catalogues === undefined) continue;
    found.push({
      package: service.manifest.package,
      from: relative(root, join(folder, "assets", "lang"))
        .split(sep)
        .join("/"),
      catalogues,
    });
  }
  return found;
}
