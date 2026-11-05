/**
 * Stackra file contract:
 * Purpose: `checkEnvironmentRegion(root)`, the region check of a product's parsed root runway: its staging and
 *          production each name `region` (`me`, `eu` or `ksa`), since figentra/infra derives the environment's
 *          account (`ref:aws.accounts.<region>`) and Infisical project from it (ADR 0524).
 * Boundary: pure; returns every failure instead of throwing, for `runway validate` to print. A runway without
 *           `product` (Stackra core) is not a product estate and is skipped; an environment it does not declare is too.
 * Runtime: isomorphic
 * Governing contract: ADR 0524; OS ADR 0001 (tenant regions); STA-2104.
 */
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
  return PLACED.filter(
    (environment) =>
      root.environments[environment] !== undefined &&
      root.environments[environment]?.region === undefined,
  ).map((environment) => ({
    path: `environments.${environment}.region`,
    message:
      "Name the tenant region this environment lives in (me, eu or ksa); figentra/infra derives its account from it",
  }));
}
