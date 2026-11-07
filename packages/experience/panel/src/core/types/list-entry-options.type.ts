/**
 * Stackra file contract:
 * Purpose: `ListEntryOptions<R, K>`, the options of `e.list(key, columns, options)`: the record's currency path for
 *          `…Minor` columns, and enum labels per column where the derived key misses.
 * Boundary: a type only; `EntryFactory` and `EntriesRecord` both take it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 8).
 */
import type { I18nKey } from "@stackra/i18n";

import type { ElementOf } from "#core/types/element-of.type";
import type { Path } from "#core/types/path.type";
import type { PathValue } from "#core/types/path-value.type";

/** The column paths of the list field `K` of `R`. */
type ColumnOf<R, K extends Path<R>> = Path<ElementOf<NonNullable<PathValue<R, K>>>>;

/** How a list entry's columns read. */
export interface ListEntryOptions<R, K extends Path<R>> {
  /** The record's currency path, for a `…Minor` column whose item has no `currency`. */
  readonly currency?: Path<R>;
  /** A column's enum labels (`{ status: I18n.orders.enums.line_status }`). */
  readonly labels?: Readonly<Partial<Record<ColumnOf<R, K>, Readonly<Record<string, I18nKey>>>>>;
}
