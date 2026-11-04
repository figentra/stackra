/**
 * Stackra file contract:
 * Purpose: `BulkActionsSpec`, the server-driven shape of the bulk bar: the actions, the bar's words, its variant,
 *          whether an action runs per record or once over the selection, whether every matching record can be
 *          selected, and whether the bulk export shows.
 * Boundary: a type only. The words that count are functions, as `BulkActionBar` takes them, so a resource table's
 *           `bulkActions` keeps only the plain fields; its actions are the ones placed at
 *           `ActionPlace.Bulk`. `once` sends the ids in the input's list of ids (`orderIds`, `ids`).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3: bulk fans out per record); ADR 0504; the SDUI catalogue case `bulkActions`
 *                     (STA-1981).
 */
import type { ActionButtonSpec } from "#core/types/action-button-spec.type";

/** The bulk bar, as data. */
export interface BulkActionsSpec {
  /** The actions in the bar. */
  readonly actions: readonly ActionButtonSpec[];
  /** The spoken name of the bar, for example "Order actions". */
  readonly label?: string | undefined;
  /** Writes the count as a sentence, for example "3 selected". */
  readonly countLabel?: ((count: number) => string) | undefined;
  /** The text of the clear button. */
  readonly clearLabel?: string | undefined;
  /** Writes the "select all matching" button, for example "Select all 245". */
  readonly selectAllLabel?: ((totalCount: number) => string) | undefined;
  /** Writes the button back to the rows shown, for example "Select only the 20 shown". */
  readonly selectShownLabel?: ((selectedCount: number) => string) | undefined;
  /** The accessible name of the native overflow button. */
  readonly moreActionsLabel?: string | undefined;
  /** `inline` above the list, or `floating` at the foot of the content. Defaults to `inline`. */
  readonly variant?: "inline" | "floating" | undefined;
  /** One run per selected record, or one run over the whole selection. Defaults to `per-record`. */
  readonly runMode?: "per-record" | "once" | undefined;
  /** True to offer selecting every matching record, not only the shown page. */
  readonly allowSelectAllMatching?: boolean | undefined;
  /** True to show the bulk export. */
  readonly export?: boolean | undefined;
}
