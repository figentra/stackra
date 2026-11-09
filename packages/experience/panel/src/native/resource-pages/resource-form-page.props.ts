/**
 * Stackra file contract:
 * Purpose: `ResourceFormPageProps`, the props of the native generic Create and Edit page: the web page's own.
 * Boundary: props only. Gen registers no resource screens on native yet, so on Edit no route hands an `:id`: the host's
 *           screen passes the record id it holds.
 * Runtime: react-native
 * Governing contract: ADR 0307; ADR 0164 (native parity).
 */
import type { ResourceRoutes } from "#core/types/resource-routes.type";

/** Props of the native `ResourceFormPage`. */
export interface ResourceFormPageProps {
  /** The resource's route constants; `operations.create` or `operations.update` is the action ref submitted. */
  readonly resource: ResourceRoutes;

  /** Create a record, or edit the one at `id`. */
  readonly mode: "create" | "edit";

  /** The record's public id on Edit, from the host screen's params; Edit refuses to draw without one. */
  readonly id?: string;
}
