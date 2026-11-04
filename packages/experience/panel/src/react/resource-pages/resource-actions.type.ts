/**
 * Stackra file contract:
 * Purpose: `ResourceActions`, what `useResourceActions` gives a resource page: the buttons at one place (with their
 *          spec look), and the bulk bar's buttons for a selection, and the open action input modal.
 * Boundary: a type only; internal to the resource pages.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 3); the SDUI catalogue case `actionButton` (STA-1981).
 */
import type { ReactElement } from "react";

import type { ActionPlace } from "#core/enums/action-place.enum";
import type { PlacedAction } from "#react/resource-pages/placed-action.type";

/** The buttons of one resource. */
export interface ResourceActions {
  /** The buttons at `place`, for `record` when the place is a record's (row, View, Edit). */
  at: (place: ActionPlace, record?: object) => PlacedAction[];

  /** The bulk bar's buttons for the selected ids. */
  bulk: (ids: readonly string[]) => PlacedAction[];

  /** The open modal form of an action whose input needs more than the record id; the page draws it. */
  readonly modal: ReactElement | null;
}
