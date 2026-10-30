/**
 * Stackra file contract:
 * Purpose: `workloadParameter(plan, folder, name)`, the SSM parameter a workload's task reads a secret from:
 *          `/<project>/<env>/<folder>/<NAME>`, where the folder mirrors the Infisical folder the sync copies from
 *          (`workloads/<workload>` for its own secrets, `runtime/<resource>` for a resource it uses).
 * Boundary: pure; a name, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 4, owner answer Q6), ADR 0444 (decision 4: SSM filled by the Infisical sync).
 */
import type { RuntimePlan } from "#core/types/runtime-plan.type";

/**
 * The SSM parameter of secret `name` in `folder`.
 *
 * @example
 * workloadParameter(plan, "runtime/main-db", "MAIN_DB_URL"); // "/academorix/production/runtime/main-db/MAIN_DB_URL"
 */
export function workloadParameter(
  plan: Pick<RuntimePlan, "project" | "environment">,
  folder: string,
  name: string,
): string {
  return `/${plan.project}/${plan.environment}/${folder}/${name}`;
}
