/**
 * Stackra file contract:
 * Purpose: `checkRegions(root)`, the region check of a parsed root runway: every region's cloud has its `providers`
 *          section, and every region an environment deploys to is declared in `regions`.
 * Boundary: pure; returns every failure instead of throwing, for `stackra validate` to print. A region without a cloud
 *           or a location already fails the schema. Nothing is deployed or contacted.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decision 4 and enforcement: the schema refuses a region without a cloud).
 */
import { Enum } from "@stackra/contracts";

import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { RegionIssue } from "#core/types/region-issue.type";
import type { RootRunway } from "#core/types/root-runway.type";

/**
 * Every region failure of `root`: the `regions` section in key order, then the environments in promotion order.
 *
 * @example
 * checkRegions(root);
 * // [{ environment: "production", code: "unknown_region", subject: "us", message: "…" }]
 */
export function checkRegions(root: RootRunway): RegionIssue[] {
  const issues: RegionIssue[] = [];
  const regions = root.regions ?? {};
  const providers: Readonly<Record<string, unknown>> = root.providers ?? {};
  for (const key of Object.keys(regions).sort()) {
    const { cloud } = regions[key] as NonNullable<RootRunway["regions"]>[string];
    if (providers[cloud] === undefined)
      issues.push({
        code: "cloud_unconfigured",
        subject: key,
        message: `region "${key}" runs on ${cloud}, but \`providers.${cloud}\` is not declared`,
      });
  }
  for (const environment of Enum.values(RunwayEnvironment))
    for (const key of root.environments[environment]?.regions ?? [])
      if (!Object.hasOwn(regions, key))
        issues.push({
          environment,
          code: "unknown_region",
          subject: key,
          message: `${environment}: deploys to "${key}", which \`regions\` does not declare`,
        });
  return issues;
}
