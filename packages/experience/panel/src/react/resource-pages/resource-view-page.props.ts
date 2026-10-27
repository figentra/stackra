/**
 * Stackra file contract:
 * Purpose: `ResourceViewPageProps`, the props of the generic View page.
 * Boundary: props only; the record id comes from the route (`:id`) unless given.
 * Runtime: browser
 * Governing contract: ADR 0307; ADR 0164.
 */
import type { ResourceRoutes } from "#core/types/resource-routes.type";

/** Props of `ResourceViewPage`. */
export interface ResourceViewPageProps {
  /** The resource's route constants; its `operations.view` is the get query ref. */
  readonly resource: ResourceRoutes;

  /** The record's public id; the route's `:id` when absent. */
  readonly id?: string;
}
