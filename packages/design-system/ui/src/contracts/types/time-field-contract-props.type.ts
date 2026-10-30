/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TimeField` takes: a labelled field over a time of day, typed by segment on the
 *          web and chosen from the platform's time picker on native.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055.
 */
import type { HourCycle } from "#contracts/enums/hour-cycle.enum";
import type { TextFieldVariant } from "#contracts/enums/text-field-variant.enum";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { TimeValue } from "#contracts/types/time-value.type";

/** Props shared by the web and native `TimeField`. */
export interface TimeFieldContractProps extends FieldContractProps<TimeValue | null> {
  /** The look of the field: `primary` on the page, `secondary` on a tinted surface. Defaults to `primary`. */
  readonly variant?: TextFieldVariant | undefined;
  /** True to fill the parent's width. Defaults to true. */
  readonly isFullWidth?: boolean | undefined;
  /** 12 or 24 hours; defaults to the locale's. */
  readonly hourCycle?: HourCycle | undefined;
}
