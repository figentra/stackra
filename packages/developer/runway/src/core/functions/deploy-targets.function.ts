/**
 * Stackra file contract:
 * Purpose: `deployTargets(root, environment)`, every place a release of `environment` lands, in release order: each
 *          kind of member the environment places (build order), in each region it lists (release order), then the
 *          services of each dedicated deployment in its own regions, with the destination's settings and the blocks
 *          its provider reads.
 * Boundary: pure; a parsed root runway in, plain data out, nothing contacted. A dedicated deployment ships the
 *           environment's services only: web, mobile, desktop and docs are one per environment. An environment without
 *           regions gives one target per kind with no region.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decisions 2 and 3), ADR 0354 (decision 4), ADR 0400 (dedicated deployments ride the
 *                     environment's release train), OS-12 (a release rolls region by region).
 */
import { Enum } from "@stackra/contracts";

import { DeployKind } from "#core/enums/deploy-kind.enum";
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { regionsOf } from "#core/functions/regions-of.function";
import type { DeployTarget } from "#core/types/deploy-target.type";
import type { RootRunway } from "#core/types/root-runway.type";
import type { RunwayRegion } from "#core/types/runway-region.type";

/**
 * The targets of `environment`.
 *
 * @throws RunwayUnresolvedError when the root runway has no such environment, or it (or a dedicated deployment) lists
 *         a region `regions` does not declare.
 * @example
 * deployTargets(root, "production").map((target) => target.id);
 * // ["production/services/ksa", "production/services/ksa/dedicated:firm", "production/mobile"]
 */
export function deployTargets(root: RootRunway, environment: RunwayEnvironment): DeployTarget[] {
  const block = root.environments[environment];
  if (block === undefined)
    throw new RunwayUnresolvedError(`The root runway has no \`environments.${environment}\``);
  const scope: Readonly<Record<string, unknown>> = block;
  const shared = regionsOf(root, environment);
  const inRegions = (regions: readonly RunwayRegion[]) =>
    regions.length === 0 ? [undefined] : regions;

  const targets: DeployTarget[] = [];
  for (const kind of Enum.values(DeployKind)) {
    const destination = block.destinations?.[kind];
    if (destination === undefined) continue;
    const settings = root.targets?.[destination] ?? {};
    for (const region of inRegions(shared))
      targets.push({
        id: [environment, kind, region?.key].filter(Boolean).join("/"),
        environment,
        kind,
        destination,
        ...(region !== undefined && { region }),
        ...(block.cloud !== undefined && { cloud: block.cloud }),
        settings,
        scope,
      });
    if (kind !== DeployKind.Services) continue;
    for (const [key, dedicated] of Object.entries(block.dedicated ?? {})) {
      const regions =
        dedicated.regions === undefined ? shared : regionsOf(root, environment, dedicated.regions);
      for (const region of inRegions(regions))
        targets.push({
          id: [environment, kind, region?.key, `dedicated:${key}`].filter(Boolean).join("/"),
          environment,
          kind,
          destination,
          ...(region !== undefined && { region }),
          cloud: dedicated.cloud,
          dedicated: { key, tenant: dedicated.tenant },
          settings,
          scope: dedicated.encore === undefined ? scope : { ...scope, encore: dedicated.encore },
        });
    }
  }
  return targets;
}
