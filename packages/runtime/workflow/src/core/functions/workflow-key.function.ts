/**
 * Stackra file contract:
 * Purpose: `workflowKey`, the key the journal stores a workflow or signal class under: its registered key, else its
 *          class name, registered on first use so this process finds the class again.
 * Boundary: internal; reads and, on first use, writes `WORKFLOW_KEYS` through `registerWorkflows`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22); the queue precedent (`readJob`).
 */
import type { AnyClass } from "@stackra/container";

import { WORKFLOW_KEYS } from "#core/constants/workflow-keys.constant";
import { registerWorkflows } from "#core/functions/register-workflows.function";

/**
 * The key of `type`.
 *
 * @throws TypeError when `type` is neither a workflow nor a signal, or its class name is another class's key.
 * @example
 * workflowKey(RedeemPointsWorkflow); // "loyalty_kit.redeem_points", or "RedeemPointsWorkflow" unregistered
 */
export function workflowKey(type: AnyClass): string {
  const known = WORKFLOW_KEYS.keys.get(type);
  if (known !== undefined) return known;
  registerWorkflows([{ type, key: type.name }]);
  return type.name;
}
