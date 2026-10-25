/**
 * Stackra file contract:
 * Purpose: `regionsOf(root, environment)`, the regions an environment deploys to, resolved from the root runway, in its
 *          release order.
 * Boundary: pure; reads the parsed root only. An environment that lists no regions deploys to none here (a
 *           single-region repository keeps `providers.aws.region`). Run `checkRegions` first: a region the root does
 *           not declare throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decision 4); OS-12 (a release rolls region by region).
 */
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { RootRunway } from "#core/types/root-runway.type";
import type { RunwayRegion } from "#core/types/runway-region.type";

/**
 * The resolved regions of `environment`.
 *
 * @throws RunwayUnresolvedError when the environment lists a region `regions` does not declare.
 * @example
 * regionsOf(root, "production").map((region) => `${region.cloud}:${region.location}`);
 * // ["aws:eu-central-1", "gcp:me-central2"]
 */
export function regionsOf(root: RootRunway, environment: RunwayEnvironment): RunwayRegion[] {
  const regions = root.regions ?? {};
  return (root.environments[environment]?.regions ?? []).map((key) => {
    if (!Object.hasOwn(regions, key))
      throw new RunwayUnresolvedError(
        `${environment} deploys to "${key}", which the root runway's \`regions\` does not declare`,
      );
    const { cloud, location, account, jurisdiction } = regions[key] as NonNullable<
      RootRunway["regions"]
    >[string];
    return {
      key,
      cloud,
      location,
      ...(account !== undefined && { account }),
      ...(jurisdiction !== undefined && { jurisdiction }),
    };
  });
}
