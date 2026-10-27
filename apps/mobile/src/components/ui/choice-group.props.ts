/**
 * Stackra file contract:
 * Purpose: `ChoiceGroupProps`: props of `ChoiceGroup`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { Choice } from "./choice.type";

/** Props of {@link ChoiceGroup}. */
export interface ChoiceGroupProps<Value extends string> {
  /** The group's name, shown above the buttons and read by screen readers. */
  label: string;
  /** The choices, in display order. */
  choices: readonly Choice<Value>[];
  /** The selected value. */
  value: Value;
  /** Called with the value of the choice the user picked. */
  onChange: (value: Value) => void;
}
