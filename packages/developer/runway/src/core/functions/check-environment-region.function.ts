/**
 * Stackra file contract:
 * Purpose: `checkEnvironmentRegion(root)`, the region check of a product's parsed root runway: its staging and
 *          production each name `region` (`me`, `eu` or `ksa`), since figentra/infra places the environment in that
 *          region of the product's one account (`ref:aws.account`) and picks its Infisical project from it (ADR 0524);
 *          and any environment in `ksa`, which runs in Google Cloud, needs the product's GCP project
 *          (`providers.gcp.project: true`).
 * Boundary: pure; returns every failure instead of throwing, for `runway validate` to print. A runway without
 *           `product` (Stackra core) is not a product estate and is skipped; an environment it does not declare is too.
 * Runtime: isomorphic
 * Governing contract: ADR 0524; OS ADR 0001 (tenant regions); STA-2104.
 */
import { RegionKey } from "#core/enums/region-key.enum";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { RootRunway } from "#core/types/root-runway.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";

/** The environments a product must place in a region. */
const PLACED = [RunwayEnvironment.Staging, RunwayEnvironment.Production] as const;

/**
 * Every declared staging or production environment of a product runway that names no region.
 *
 * @example
 * checkEnvironmentRegion(root);
 * // [{ path: "environments.staging.region", message: "Name the tenant region …" }]
 */
export function checkEnvironmentRegion(root: RootRunway): RunwayIssue[] {
  if (root.product === undefined) return [];
  const unplaced = PLACED.filter(
    (environment) =>
      root.environments[environment] !== undefined &&
      root.environments[environment]?.region === undefined,
  ).map((environment) => ({
    path: `environments.${environment}.region`,
    message:
      "Name the tenant region this environment lives in (me, eu or ksa); figentra/infra places it there",
  }));
  const withoutProject =
    root.providers?.gcp?.project === true
      ? []
      : Object.entries(root.environments)
          .filter(([, environment]) => environment?.region === RegionKey.Ksa)
          .map(([name]) => ({
            path: `environments.${name}.region`,
            message:
              "ksa runs in Google Cloud: set `providers.gcp.project: true` so figentra/infra vends the product's project",
          }));
  return [...unplaced, ...withoutProject];
}
