/**
 * Stackra file contract:
 * Purpose: `bundleEditionCatalogue`, an edition's effective plan catalogue: its own catalogue with the bundled base
 *          module entitlements sold as its modules and included by each tier (the bundle's every-tier list plus the
 *          tier's own list), so `tierPlan` grants them as it grants the edition's own.
 * Boundary: pure; never mutates its inputs. A bundled key the base catalogue does not sell, or a tier key the edition
 *           catalogue lacks, is a `RangeError` (the registry refuses such an edition, ADR 0335 enforcement). Base
 *           modules outside the bundle never reach the result, so the edition's scopes cannot hold them.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decision 6 and enforcement); ADR 0215 (decisions 1 and 3); ADR 0391 (decision 1).
 */
import type { EditionEntitlementBundle } from "#core/types/edition-entitlement-bundle.type";
import type { PlanCatalogue } from "#core/types/plan-catalogue.type";

/**
 * The catalogue of `edition` with `bundle`'s base modules from `base`.
 *
 * @throws RangeError when a bundled module is not sold by `base` or a bundled tier is not in `edition`.
 * @example
 * tierPlan(bundleEditionCatalogue(fashion, { of: "commerce", modules: ["catalog"] }, commerce), "pro");
 */
export function bundleEditionCatalogue(
  edition: PlanCatalogue,
  bundle: EditionEntitlementBundle,
  base: PlanCatalogue,
): PlanCatalogue {
  const sold = new Set(base.modules.map((module) => module.key));
  const tiers = new Set(edition.tiers.map((tier) => tier.key));
  for (const [tier, keys] of [
    ["*", bundle.modules] as const,
    ...Object.entries(bundle.tiers ?? {}),
  ]) {
    if (tier !== "*" && !tiers.has(tier))
      throw new RangeError(`bundleEditionCatalogue: no tier ${tier} in the edition catalogue`);
    for (const key of keys)
      if (!sold.has(key))
        throw new RangeError(`bundleEditionCatalogue: ${bundle.of} sells no module ${key}`);
  }
  const own = new Set(edition.modules.map((module) => module.key));
  const bundled = [
    ...new Set([...bundle.modules, ...Object.values(bundle.tiers ?? {}).flat()]),
  ].filter((key) => !own.has(key));
  return {
    ...edition,
    modules: [...edition.modules, ...bundled.map((key) => ({ key }))],
    tiers: edition.tiers.map((tier) => ({
      ...tier,
      modules: [
        ...new Set([...tier.modules, ...bundle.modules, ...(bundle.tiers?.[tier.key] ?? [])]),
      ],
    })),
  };
}
