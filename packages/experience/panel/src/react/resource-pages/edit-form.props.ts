/**
 * Stackra file contract:
 * Purpose: `EditFormProps`, the props of the web and native Edit form that reads its record before it draws.
 * Boundary: props only; internal to the form pages of both entries.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys; rule 3).
 */
import type { ActionRef } from "@stackra/clients";

import type { ResourceRoutes } from "#core/types/resource-routes.type";

/** Props of an Edit form. */
export interface EditFormProps {
  /** The resource whose record is edited. */
  readonly resource: ResourceRoutes;

  /** The update action the form submits. */
  readonly action: ActionRef;

  /** The record's public id; the route's `:id` on the web when absent. */
  readonly id?: string | undefined;
}
