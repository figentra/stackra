/**
 * Stackra file contract:
 * Purpose: `ToastAction`: the one action a toast can carry, such as "Undo".
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 4.1.3 and 2.2.1.
 */
/** The one action a toast can carry, such as "Undo"; pressing it runs `onPress` and then dismisses the toast. */
export interface ToastAction {
  /** The button's text in the app's language. */
  readonly label: string;
  /** Called when the action is pressed, by pointer, touch or keyboard. */
  readonly onPress: () => void;
}
