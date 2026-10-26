/**
 * Stackra file contract:
 * Purpose: `DateInputPickerProps`: the platform picker's props the field passes through.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312 (open state); ADR 0318 (decisions 8 and 10); ADR 0055 (forms); ADR 0165 (HeroUI Native on
 *          native); WCAG 2.2 SC 1.3.1, 3.3.1, 4.1.2, 4.1.3.
 */
import type { DateTimePickerProps } from "@expo/ui/community/datetime-picker";

/** The platform picker's props the field passes through; the rest are the field's own. */
export type DateInputPickerProps = Omit<
  DateTimePickerProps,
  | "value"
  | "onChange"
  | "onValueChange"
  | "onDismiss"
  | "mode"
  | "minimumDate"
  | "maximumDate"
  | "disabled"
  | "locale"
  | "presentation"
  | "timeZoneName"
>;
