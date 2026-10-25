/**
 * Stackra file contract:
 * Purpose: `DashboardProps`, what the panel's `Dashboard` takes: the panel, the slots it lays out, whether a scope's
 *          published layout may override it, the dashboard's range and the actor facts binds read.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); ADR 0307 (rules 18 to 20); ADR 0306 (layers 4 and 5).
 */
import type { TimeRange } from "#core/enums/time-range.enum";
import type { PanelRef } from "#core/types/panel-ref.type";
import type { SlotRef } from "#core/types/slot-ref.type";

/** The props of a dashboard. */
export interface DashboardProps {
  /** The panel whose widgets are laid out (`Panels.Admin`). */
  readonly panel: PanelRef;

  /** The slots to lay out, in order (`[Slots.Dashboard.Main]`). */
  readonly slots: readonly SlotRef[];

  /** Whether a scope's published layout (layer 4) and the user's overlay (layer 5) may replace the code layout. */
  readonly overridable?: boolean;

  /** The range every tile that takes one shows; each tile picks its own when absent. */
  readonly range?: TimeRange;

  /** The signed-in actor's facts the widgets' `actor.*` binds read. */
  readonly actor?: Readonly<Record<string, unknown>>;
}
