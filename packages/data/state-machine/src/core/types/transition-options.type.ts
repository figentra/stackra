/**
 * Stackra file contract:
 * Purpose: `TransitionOptions`, what `@Transition({ from, to })` records on a method of a state machine.
 * Boundary: a type only. `from` is the transition's precondition: the record must be in one of these states, or the
 *           call is refused with `transition_not_allowed`. The permission is the calling action's, not an option here
 *           (ADR 0161, 0294 note).
 * Runtime: isomorphic
 * Governing contract: ADR 0161 (0294 note: "guard" reads "precondition"); ADR 0294 (decisions 6 and 23).
 */

/** The options of `@Transition({ ... })`. */
export interface TransitionOptions {
  /** The state, or the states, the record must be in for the transition to run. */
  readonly from: string | readonly string[];

  /** The state the field is set to once the body has run. */
  readonly to: string;
}
