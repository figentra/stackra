/**
 * Stackra file contract:
 * Purpose: `FilterDefinitionBase`: what every filter definition carries, whatever its kind.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0318.
 */
import type { FilterKind } from "#contracts/enums/filter-kind.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** What every filter definition carries, whatever its kind. */
export interface FilterDefinitionBase<TKind extends FilterKind> {
  /** The key of the filter; unique in the list, and the key its value has in a `FilterState`. */
  readonly id: string;
  /** The name of the filter, shown in the add-filter menu and on its chip; it is also its accessible name. */
  readonly label: string;
  /** Which editor the filter opens and which value it holds. */
  readonly kind: TKind;
  /** An icon drawn before the label in the add-filter menu: an icon name or any icon element. */
  readonly icon?: IconSlot | undefined;
  /** True to list the filter but refuse adding it, for example while its options load. */
  readonly isDisabled?: boolean | undefined;
}
