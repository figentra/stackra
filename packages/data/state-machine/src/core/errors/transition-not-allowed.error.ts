/**
 * Stackra file contract:
 * Purpose: `TransitionNotAllowedError` (`transition_not_allowed`), the refusal of a transition called on a record that
 *          is in none of its `from` states.
 * Boundary: thrown by a transition before its body runs, so nothing changed; a conflict refusal (409), never retryable,
 *           because waiting does not move the record. Its details are the transition's name and the record's state.
 * Runtime: isomorphic
 * Governing contract: ADR 0161 (0294 note); ADR 0140 (envelope and kinds); ADR 0232 (decision 2).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The record is not in a state the transition starts from. */
export class TransitionNotAllowedError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The transition that was called (`cancel`). */
  transition!: string;

  /** The state the record was in (`paid`). */
  state!: string;
}
