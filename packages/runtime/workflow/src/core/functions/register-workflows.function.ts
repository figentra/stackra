/**
 * Stackra file contract:
 * Purpose: `registerWorkflows`, how gen's generated entry tells the engine the locked key of each workflow and signal
 *          of the `workflows/` group, so a run started in one process resumes in another, and a held signal matches
 *          its wait, by key.
 * Boundary: writes the process-wide `WORKFLOW_KEYS`; a later row for a class replaces its earlier key. Checks each row,
 *           so a wrong row fails at boot rather than on the first resume. A class nobody registered is registered
 *           under its class name when the engine first uses it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22); the queue precedent (`registerJobs`).
 */
import { kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import { WORKFLOW_KEYS } from "#core/constants/workflow-keys.constant";

/**
 * Registers workflow and signal classes with their locked keys.
 *
 * @throws TypeError when a row's class is not a workflow or a signal, its key is empty, or another class has its key.
 * @example
 * registerWorkflows([
 *   { type: RedeemPointsWorkflow, key: "loyalty_kit.redeem_points" },
 *   { type: RedemptionConfirmed, key: "loyalty_kit.redemption_confirmed" },
 * ]);
 */
export function registerWorkflows(
  rows: readonly { readonly type: AnyClass; readonly key: string }[],
): void {
  for (const { type, key } of rows) {
    const kind = kindOf(type)?.kind;
    if (kind !== "workflow" && kind !== "signal")
      throw new TypeError(`registerWorkflows: ${type.name} is not a workflow or a signal`);
    if (typeof key !== "string" || key === "")
      throw new TypeError(`registerWorkflows: ${type.name} needs its locked key`);
    const holder = WORKFLOW_KEYS.byKey.get(key);
    if (holder !== undefined && holder !== type)
      throw new TypeError(
        `registerWorkflows: ${type.name} and ${holder.name} share the key ${key}`,
      );
    const previous = WORKFLOW_KEYS.keys.get(type);
    if (previous !== undefined) WORKFLOW_KEYS.byKey.delete(previous);
    WORKFLOW_KEYS.byKey.set(key, type);
    WORKFLOW_KEYS.keys.set(type, key);
  }
}
