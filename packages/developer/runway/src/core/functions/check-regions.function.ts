/**
 * Stackra file contract:
 * Purpose: `checkRegions(root)`, the region and cloud check of a parsed root runway: every region's cloud has its
 *          `providers` section, every region an environment or a dedicated deployment deploys to is declared in
 *          `regions`, and every `cloud` names a configured cloud and an account (AWS) or project (GCP) it holds.
 * Boundary: pure; returns every failure instead of throwing, for `stackra validate` to print. A region without a cloud
 *           or a location already fails the schema. Nothing is deployed or contacted.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decision 4 and enforcement: the schema refuses a region without a cloud), ADR 0400
 *                     (the `cloud` field and dedicated deployments).
 */
import { Enum } from "@stackra/contracts";

import { RunwayCloud } from "#core/enums/runway-cloud.enum";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { RegionIssue } from "#core/types/region-issue.type";
import type { RootRunway } from "#core/types/root-runway.type";

/** The `providers.<cloud>` key that lists a cloud's accounts or projects. */
const ACCOUNTS_KEY = { [RunwayCloud.Aws]: "accounts", [RunwayCloud.Gcp]: "projects" } as const;

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
  for (const environment of Enum.values(RunwayEnvironment)) {
    const block = root.environments[environment];
    const deployments = [
      { label: environment, regions: block?.regions, cloud: block?.cloud },
      ...Object.entries(block?.dedicated ?? {}).map(([key, dedicated]) => ({
        label: `${environment} dedicated "${key}"`,
        regions: dedicated.regions,
        cloud: dedicated.cloud,
      })),
    ];
    for (const { label, regions: listed, cloud } of deployments) {
      for (const key of listed ?? [])
        if (!Object.hasOwn(regions, key))
          issues.push({
            environment,
            code: "unknown_region",
            subject: key,
            message: `${label}: deploys to "${key}", which \`regions\` does not declare`,
          });
      if (cloud === undefined) continue;
      const section = providers[cloud.name] as Readonly<Record<string, unknown>> | undefined;
      const accounts = section?.[ACCOUNTS_KEY[cloud.name]] as Readonly<object> | undefined;
      if (section === undefined)
        issues.push({
          environment,
          code: "cloud_unconfigured",
          subject: cloud.account,
          message: `${label}: runs on ${cloud.name}, but \`providers.${cloud.name}\` is not declared`,
        });
      else if (accounts === undefined || !Object.hasOwn(accounts, cloud.account))
        issues.push({
          environment,
          code: "unknown_account",
          subject: cloud.account,
          message: `${label}: \`providers.${cloud.name}.${ACCOUNTS_KEY[cloud.name]}\` has no "${cloud.account}"`,
        });
    }
  }
  return issues;
}
