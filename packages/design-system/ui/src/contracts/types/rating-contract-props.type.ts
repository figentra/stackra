/**
 * Stackra file contract:
 * Purpose: `RatingContractProps`, the props every runtime's `Rating` takes: a score out of `maxValue` stars (or another
 *          icon) that people pick, or that is shown read-only with a fraction (3.5 fills half of the fourth star).
 * Boundary: types only. Picking is in whole stars; a read-only rating is one image named "3.5 out of 5 stars", not a
 *           group of radios, so it is not submitted with a form.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { Size } from "#contracts/enums/size.enum";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props shared by the web and native `Rating`. The value is the number of stars; 0 is no rating. */
export interface RatingContractProps extends FieldContractProps<number> {
  /** How many stars; defaults to 5. */
  readonly maxValue?: number | undefined;
  /** The star size: `sm` 16, `md` 20, `lg` 24 points. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** The icon drawn for each star, filled with the current colour; defaults to `star`. */
  readonly icon?: IconSlot | undefined;
  /** True to show the value as one image, fractions included; it is not focused or submitted. */
  readonly isReadOnly?: boolean | undefined;
  /** True to let a press on the chosen star, or Delete, clear the rating back to 0. */
  readonly isClearable?: boolean | undefined;
}
