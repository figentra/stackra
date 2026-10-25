/**
 * Stackra file contract:
 * Purpose: `PanelState`, what the panel shell shares with the components under it: the panel it frames.
 * Boundary: a type only, internal to the `./react` entry. The breadcrumb trail is navigation's
 *           (`BreadcrumbsProvider`), which the shell mounts.
 * Runtime: browser
 * Governing contract: ADR 0164; ADR 0303 (decision 1: router-aware UI belongs to navigation).
 */
import type { PanelRef } from "#core/types/panel-ref.type";

/** The shell's shared state. */
export interface PanelState {
  /** The panel the shell frames. */
  readonly panel: PanelRef;
}
