/**
 * Stackra file contract:
 * Purpose: `deprecatedFields(root)`, the deprecated fields a parsed root runway still sets, each with what replaces it:
 *          `providers.aws.region` and `providers.aws.accounts` (the three-account layout that no longer matches ADR
 *          0524) give way to `environments.<env>.region`.
 * Boundary: pure; `runway validate` prints each as a warning and still passes. The fields stay accepted for one release.
 * Runtime: isomorphic
 * Governing contract: ADR 0524; STA-2104.
 */
import type { RootRunway } from "#core/types/root-runway.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";

/**
 * Every deprecated field `root` sets, `[]` when none.
 *
 * @example
 * deprecatedFields(root);
 * // [{ path: "providers.aws.region", message: "Deprecated: …" }]
 */
export function deprecatedFields(root: RootRunway): RunwayIssue[] {
  const aws = root.providers?.aws;
  const found: RunwayIssue[] = [];
  if (aws?.region !== undefined)
    found.push({
      path: "providers.aws.region",
      message:
        "Deprecated: set `region` (me, eu or ksa) on each environment instead; removed in the next release",
    });
  if (aws?.accounts !== undefined)
    found.push({
      path: "providers.aws.accounts",
      message:
        "Deprecated: a product has one AWS account (`ref:aws.account`), and each environment names its `region`; removed in the next release",
    });
  return found;
}
