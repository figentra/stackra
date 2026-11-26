/**
 * Stackra file contract:
 * Purpose: `formActionOf(resource, mode)`, the action a resource's Create or Edit form submits: its `create` operation,
 *          or its `update` one.
 * Boundary: internal: pure; the web and native form pages import it by path. Throws when the resource declares no such
 *           action, so a page without one fails loudly rather than drawing a form that cannot save.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys are paths of the create or update input).
 */
import type { ActionRef } from "@stackra/clients";

import type { ResourceRoutes } from "#core/types/resource-routes.type";

/**
 * The action the `mode` form of `resource` submits.
 *
 * @throws TypeError when the resource has no create (or update) action.
 * @example
 * formActionOf(Resources.Order, "edit"); // UpdateOrderAction
 */
export function formActionOf(resource: ResourceRoutes, mode: "create" | "edit"): ActionRef {
  const operation = mode === "create" ? "create" : "update";
  const action = resource.operations[operation] as ActionRef | undefined;
  if (action === undefined) throw new TypeError(`${resource.key} has no ${operation} action`);
  return action;
}
