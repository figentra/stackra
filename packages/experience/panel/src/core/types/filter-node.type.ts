/**
 * Stackra file contract:
 * Purpose: `FilterNode`, one recorded table filter: a row path, its operator kind (a value, a principal, a range, a
 *          date range, a comparison, contains or is-null) with its default and whether it is pinned beside search, or
 *          the trashed filter of a soft-deleting model.
 * Boundary: a type only; built by `Filter.*` and by the table builder. `tableInput` turns the drawn value into the wire
 *           `TableFilter` of the kind, which `CrudService.table` compiles. A field filter also carries its `FilterSpec`
 *           look (words, `control` for the spec's `kind`, the quick filter's settings, choices, presets).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2: filter is a typed object of the declared filters); reporting gap 5; the SDUI
 *                     catalogue case `tableFilters` (STA-1981).
 */
import type { Enum } from "@stackra/contracts";

import type { FilterComparison } from "#core/enums/filter-comparison.enum";
import type { FilterKind } from "#core/enums/filter-kind.enum";
import type { FilterSpec } from "#core/types/filter-spec.type";

/** The per-filter fields of a filter spec; the spec's `kind` is `control`, the bar's fields are the table's. */
type FilterLook = Omit<
  FilterSpec,
  "id" | "kind" | "pinned" | "searchPlaceholder" | "searchLabel" | "canSaveView"
> & {
  /** The control drawn in place of the one the operator implies. */
  readonly control?: FilterKind | undefined;
};

/** One table filter. */
export type FilterNode =
  | (FilterLook & {
      /**
       * As typed, a principal picker, an inclusive range, a date range (bounds or a `TimeRange` code), a comparison,
       * a case-insensitive substring, or whether the field is empty.
       */
      readonly kind:
        | "value"
        | "principal"
        | "range"
        | "dateRange"
        | "compare"
        | "contains"
        | "isNull";
      /** The row path; it needs an index (`filter_not_indexed`). */
      readonly key: string;
      /** The value the filter starts with. */
      readonly default?: unknown;
      /** Whether it sits beside the search box. */
      readonly pinned?: boolean;
      /** The enum whose codes the filter offers; gen fills it from the row type. */
      readonly enum?: Enum.Any;
      /** The comparison of a `compare` filter. */
      readonly operator?: FilterComparison;
    })
  | {
      /** With, without or only soft-deleted records. */
      readonly kind: "trashed";
    };
