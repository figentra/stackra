/**
 * Stackra file contract:
 * Purpose: `deprecatedFields(root)`, the deprecated fields a parsed root runway still sets, each with what replaces it:
 *          `providers.aws.region` and `providers.aws.accounts` (the three-account layout that no longer matches ADR
 *          0524), a per-role `providers.aws.budgets.monthlyUsd` and an environment's `cloud` give way to
 *          `environments.<env>.region` and the product's one account; `providers.infisical` and `secrets.defaultPath`
 *          give way to the sops scopes of figentra/secrets and are ignored (ADR 0525).
 * Boundary: pure; `runway validate` prints each as a warning and still passes. The fields stay accepted for one release.
 * Runtime: isomorphic
 * Governing contract: ADR 0524; ADR 0525; STA-2104.
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
  if (typeof aws?.budgets?.monthlyUsd === "object")
    found.push({
      path: "providers.aws.budgets.monthlyUsd",
      message:
        "Deprecated: a budget per account role belongs to the three-account layout; set one number for the product's one account; removed in the next release",
    });
  if (aws?.accounts !== undefined)
    found.push({
      path: "providers.aws.accounts",
      message:
        "Deprecated: a product has one AWS account (`ref:aws.account`), and each environment names its `region`; removed in the next release",
    });
  if (root.providers?.["infisical"] !== undefined)
    found.push({
      path: "providers.infisical",
      message:
        "Deprecated and ignored: secret values come from sops scopes in figentra/secrets, decrypted by .github/actions/secrets-decrypt (ADR 0525); remove the block",
    });
  if (root.secrets?.defaultPath !== undefined)
    found.push({
      path: "secrets.defaultPath",
      message:
        "Deprecated and ignored: it named a providers.infisical path; a product's secrets live in products/<project>/<env> (ADR 0525); remove it",
    });
  for (const [name, environment] of Object.entries(root.environments))
    if (environment?.cloud !== undefined)
      found.push({
        path: `environments.${name}.cloud`,
        message:
          "Deprecated: the environment's `region` fixes its cloud, and the product's one account or project is `providers.aws.account` or `providers.gcp.project`; removed in the next release",
      });
  return found;
}
