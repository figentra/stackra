/**
 * Stackra file contract:
 * Purpose: `EntryRow`, one row of a View page's property list: its id and label, and either one value or a list's
 *          small table (its columns, its items and each cell's value).
 * Boundary: a type only; `entryRowsOf` builds it and the web and native View pages draw it with their own kit.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 and 2); ADR 0164.
 */
import type { ValueCell } from "#core/types/value-cell.type";

/** One property row. */
export type EntryRow = {
  /** The entry's record path. */
  readonly id: string;
  /** The entry's label. */
  readonly label: string;
} & (
  | {
      /** The value shown. */
      readonly cell: ValueCell;
      readonly list?: undefined;
    }
  | {
      readonly cell?: undefined;
      /** The list's small table. */
      readonly list: {
        /** The item paths as columns, with their labels. */
        readonly columns: readonly { readonly id: string; readonly label: string }[];
        /** The items, each with its place as id. */
        readonly items: readonly (object & { readonly id: string })[];
        /** The value of `item` in the column `columnId`. */
        readonly cell: (item: object, columnId: string) => ValueCell;
      };
    }
);
