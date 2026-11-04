/**
 * Stackra file contract:
 * Purpose: `FilterSpec`, the server-driven shape of one table filter and the filter bar around it: the field filtered,
 *          its words, the control, the quick filter's settings (hint, disabled, step, yes and no words), the choices with
 *          their words, whether it is pinned, its range presets, the search box's words and whether a view can be saved.
 * Boundary: a type only; data. A recorded filter (`FilterNode`) carries the per-filter fields but `id` (its `key`) and
 *           `kind` (its `control`, since `kind` there is the operator); the table (`TableNode`) carries the bar's
 *           `searchPlaceholder`, `searchLabel` and `canSaveView`. Text fields are words or i18n keys.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2); ADR 0504; the SDUI catalogue case `tableFilters` (STA-1981).
 */
import type { FilterKind } from "#core/enums/filter-kind.enum";

/** One table filter, as data. */
export interface FilterSpec {
  /** The row path filtered. */
  readonly id: string;
  /** The label; absent, the derived i18n key. */
  readonly label?: string | undefined;
  /** The control the filter is drawn with. */
  readonly kind?: FilterKind | undefined;
  /** Hint text of a text filter. */
  readonly placeholder?: string | undefined;
  /** True to list the filter but refuse adding it. */
  readonly isDisabled?: boolean | undefined;
  /** The step of a number filter. */
  readonly step?: number | undefined;
  /** The yes word of a boolean filter. */
  readonly trueLabel?: string | undefined;
  /** The no word of a boolean filter. */
  readonly falseLabel?: string | undefined;
  /** The choices, with their words. */
  readonly choices?:
    | readonly {
        /** The value filtered by. */
        readonly value: string;
        /** Its words. */
        readonly label: string;
      }[]
    | undefined;
  /** Shown beside the search box. */
  readonly pinned?: boolean | undefined;
  /** The range presets, as `TimeRange` codes. */
  readonly presets?: readonly string[] | undefined;
  /** Hint text inside the empty search box. */
  readonly searchPlaceholder?: string | undefined;
  /** The accessible name of the search box, for example "Search orders". */
  readonly searchLabel: string;
  /** True to offer saving the current filters as a view. */
  readonly canSaveView?: boolean | undefined;
}
