/**
 * Stackra file contract:
 * Purpose: `ResourceActions`, what `useResourceActions` gives a resource page: the buttons at one place, and the bulk
 *          bar's buttons for a selection.
 * Boundary: a type only; internal to the resource pages.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 3).
 */
import type { ResourceAction } from "@stackra/ui/contracts";

import type { ActionPlace } from "#core/enums/action-place.enum";

/** The buttons of one resource. */
export interface ResourceActions {
  /** The buttons at `place`, for `record` when the place is a record's (row, View, Edit). */
  at: (place: ActionPlace, record?: object) => ResourceAction[];

  /** The bulk bar's buttons for the selected ids. */
  bulk: (ids: readonly string[]) => ResourceAction[];
}
