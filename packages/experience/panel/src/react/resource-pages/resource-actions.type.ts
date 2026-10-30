/**
 * Stackra file contract:
 * Purpose: `ResourceActions`, what `useResourceActions` gives a resource page: the buttons at one place, and the bulk
 *          bar's buttons for a selection, and the open action input modal.
 * Boundary: a type only; internal to the resource pages.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 3).
 */
import type { ResourceAction } from "@stackra/ui/contracts";
import type { ReactElement } from "react";

import type { ActionPlace } from "#core/enums/action-place.enum";

/** The buttons of one resource. */
export interface ResourceActions {
  /** The buttons at `place`, for `record` when the place is a record's (row, View, Edit). */
  at: (place: ActionPlace, record?: object) => ResourceAction[];

  /** The bulk bar's buttons for the selected ids. */
  bulk: (ids: readonly string[]) => ResourceAction[];

  /** The open modal form of an action whose input needs more than the record id; the page draws it. */
  readonly modal: ReactElement | null;
}
