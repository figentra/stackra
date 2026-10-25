/**
 * Stackra file contract:
 * Purpose: `PanelState`, what the panel shell shares with the components under it: the panel, the breadcrumb trail and the
 *          setter pages and route adapters publish their crumb with.
 * Boundary: a type only, internal to the `./react` entry.
 * Runtime: browser
 * Governing contract: ADR 0164; ADR 0303 (decision 1: router-aware UI belongs to navigation).
 */
import type { PanelRef } from "#core/types/panel-ref.type";
import type { Breadcrumb } from "#react/breadcrumbs/breadcrumb.type";

/** The shell's shared state. */
export interface PanelState {
  /** The panel the shell frames. */
  readonly panel: PanelRef;

  /** The published crumbs by publisher id, in publication order. */
  readonly crumbs: ReadonlyMap<string, Breadcrumb>;

  /** Publishes `crumb` under `id`, or withdraws it with `null`. */
  readonly setCrumb: (id: string, crumb: Breadcrumb | null) => void;
}
