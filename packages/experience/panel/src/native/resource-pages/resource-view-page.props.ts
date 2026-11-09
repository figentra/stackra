/**
 * Stackra file contract:
 * Purpose: `ResourceViewPageProps`, the props of the native generic View page: the web page's own.
 * Boundary: props only. Gen registers no resource screens on native yet, so no route hands an `:id`: the host's screen
 *           passes the record id it holds.
 * Runtime: react-native
 * Governing contract: ADR 0307; ADR 0164 (native parity).
 */
import type { ResourceRoutes } from "#core/types/resource-routes.type";

/** Props of the native `ResourceViewPage`. */
export interface ResourceViewPageProps {
  /** The resource's route constants; its `operations.view` is the get query ref. */
  readonly resource: ResourceRoutes;

  /** The record's public id, from the host screen's params; the page refuses to draw without one. */
  readonly id?: string;
}
