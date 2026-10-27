/**
 * Stackra file contract:
 * Purpose: `ResourceFormPageProps`, the props of the generic Create and Edit page.
 * Boundary: props only; on Edit the record id comes from the route (`:id`) unless given.
 * Runtime: browser
 * Governing contract: ADR 0307; ADR 0164.
 */
import type { ResourceRoutes } from "#core/types/resource-routes.type";

/** Props of `ResourceFormPage`. */
export interface ResourceFormPageProps {
  /** The resource's route constants; `operations.create` or `operations.update` is the action ref submitted. */
  readonly resource: ResourceRoutes;

  /** Create a record, or edit the one at `id`. */
  readonly mode: "create" | "edit";

  /** The record's public id on Edit; the route's `:id` when absent. */
  readonly id?: string;
}
