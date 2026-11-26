/**
 * Stackra file contract:
 * Purpose: `ResourceFormProps`, the props of the web and native form over a create or update action's input: the
 *          resource, the action, the values it starts from and, on Edit, the record id.
 * Boundary: props only; internal to the form pages of both entries and `useResourceForm`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys; rule 3).
 */
import type { ActionRef } from "@stackra/clients";

import type { ResourceRoutes } from "#core/types/resource-routes.type";

/** Props of a resource form. */
export interface ResourceFormProps {
  /** The resource the form saves. */
  readonly resource: ResourceRoutes;

  /** The create or update action the form submits. */
  readonly action: ActionRef;

  /** The values the form starts from: the record on Edit, none on Create. */
  readonly defaults: Readonly<Record<string, unknown>>;

  /** The record's public id on Edit. */
  readonly recordId?: string | undefined;
}
