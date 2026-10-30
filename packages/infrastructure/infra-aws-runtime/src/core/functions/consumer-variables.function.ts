/**
 * Stackra file contract:
 * Purpose: `consumerVariables(plan)`, the resource variable names each consumer (a service member or a workload) gets,
 *          from the resources it uses: what the Infisical sync hands an Encore service and what a workload's task
 *          definition references.
 * Boundary: pure; names only, sorted per consumer.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 4).
 */
import { resourceVariables } from "#core/functions/resource-variables.function";
import type { RuntimePlan } from "#core/types/runtime-plan.type";

/**
 * Each consumer's resource variable names.
 *
 * @example
 * consumerVariables(plan); // { identity: ["MAIN_DB_HOST", "MAIN_DB_PASSWORD", …], zitadel: [ … ] }
 */
export function consumerVariables(plan: RuntimePlan): Record<string, string[]> {
  const names: Record<string, string[]> = {};
  for (const database of plan.databases)
    for (const consumer of database.consumers)
      names[consumer] = [
        ...(names[consumer] ?? []),
        ...Object.values(resourceVariables(database.resource)),
      ];
  return Object.fromEntries(
    Object.entries(names).map(([consumer, list]) => [
      consumer,
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy built here; toSorted is ES2023 and the base lib is ES2022
      [...list].sort(),
    ]),
  );
}
