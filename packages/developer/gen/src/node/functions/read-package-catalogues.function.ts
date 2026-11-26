/**
 * Stackra file contract:
 * Purpose: `readPackageCatalogues`, discovery's read of the lang catalogues the member's declared Stackra packages
 *          ship (`node_modules/<package>/assets/lang/<locale>/<namespace>.json`), so `#stackra/i18n` types
 *          `I18n.loyalty_kit.*` for a member that declares `@stackra/loyalty-kit` (STA-1298) or a product's own
 *          `@acme/loyalty-kit`.
 * Boundary: reads only the packages' `assets/lang` folders, found by `dependencyPath` like their manifests; writes
 *           nothing. A Stackra package is a `@stackra/*` one or any that ships `stackra.manifest.json`, so a third-party
 *           folder that happens to be named `assets/lang` is never merged. A package without the folder is skipped;
 *           an invalid catalogue throws with its path. A dependency that is a service member (its package.json
 *           `stackra.tier` is `service`, as when a member depends on a service for its contract) is read as that
 *           service's catalogues, keyed by its manifest's `member`, so a namespace the member also has moves under
 *           the service's name (`payments.plans`, `clientNamespace`) instead of clashing.
 * Runtime: node
 * Governing contract: ADR 0080 (as amended by 0305 conventions 1); ADR 0268 (R15: typed keys); STA-1298.
 */
import { readFileSync } from "node:fs";
import { dirname } from "node:path";

import type { MemberIR } from "#core/types/member-ir.type";
import { dependencyPath } from "#node/functions/dependency-path.function";
import { readCatalogues } from "#node/functions/read-catalogues.function";

/**
 * The catalogues of each declared Stackra package that ships `assets/lang`, in package.json order.
 *
 * @param root - the member root.
 * @param dependencies - the declared package names, in package.json order.
 * @throws Error when a catalogue is not valid JSON.
 * @example
 * readPackageCatalogues("services/customers", ["@stackra/loyalty-kit"])[0]?.catalogues["en"]?.["loyalty_kit"];
 */
export function readPackageCatalogues(
  root: string,
  dependencies: readonly string[],
): NonNullable<MemberIR["packageCatalogues"]> {
  const found: NonNullable<MemberIR["packageCatalogues"]>[number][] = [];
  for (const dependency of new Set(dependencies)) {
    if (
      !dependency.startsWith("@stackra/") &&
      dependencyPath(root, dependency, "stackra.manifest.json") === undefined
    )
      continue;
    const lang = dependencyPath(root, dependency, "assets/lang");
    const catalogues = lang === undefined ? undefined : readCatalogues(dirname(dirname(lang)));
    if (catalogues === undefined) continue;
    const service = serviceOf(root, dependency);
    found.push({ package: dependency, ...(service === undefined ? {} : { service }), catalogues });
  }
  return found;
}

/** The member key of `dependency` when it is a service member (package.json `stackra.tier: "service"`), else undefined. */
function serviceOf(root: string, dependency: string): string | undefined {
  const manifest = dependencyPath(root, dependency, "stackra.manifest.json");
  const pkg = dependencyPath(root, dependency, "package.json");
  if (manifest === undefined || pkg === undefined) return undefined;
  const { stackra } = JSON.parse(readFileSync(pkg, "utf8")) as {
    readonly stackra?: { readonly tier?: unknown };
  };
  if (stackra?.tier !== "service") return undefined;
  const { member } = JSON.parse(readFileSync(manifest, "utf8")) as { readonly member?: unknown };
  return typeof member === "string" && member !== "" ? member : undefined;
}
