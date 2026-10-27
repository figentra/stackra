/**
 * Stackra file contract:
 * Purpose: `Choice`: one choice of a `ChoiceGroup`.
 * Boundary: a type only, in its own file.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 10).
 */

/** One choice of a {@link ChoiceGroup}. */
export interface Choice<Value extends string> {
  /** The value passed to `onChange` when this choice is picked. */
  value: Value;
  /** The text on the button, in the language it names. */
  label: string;
}
