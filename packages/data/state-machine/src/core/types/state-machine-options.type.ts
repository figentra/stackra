/**
 * Stackra file contract:
 * Purpose: `StateMachineOptions<M>`, what the called kind base takes: `StateMachine<Order>({ field, history })`.
 * Boundary: a type only. The states are not an option: they are the codes of the field's enum, and the initial state
 *           is the field's initializer on the model (ADR 0161, 0294 note).
 * Runtime: isomorphic
 * Governing contract: ADR 0161 (0294 note); ADR 0294 (decision 16); ADR 0305 (rules 2 and 5).
 */
import type { StateField } from "#core/types/state-field.type";

/** The options of `StateMachine<M>({ ... })`. */
export interface StateMachineOptions<M> {
  /** The model field the machine governs; no other code writes it. */
  readonly field: StateField<M>;

  /** Whether each transition records a `StateTransitioned` event on the record for the audit log; true by default. */
  readonly history?: boolean;
}
