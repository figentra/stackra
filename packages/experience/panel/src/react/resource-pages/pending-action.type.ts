/**
 * Stackra file contract:
 * Purpose: `PendingAction`, an action waiting on its modal form: the action, the input key of the record id, the
 *          records, the record the form starts from and the input keys it asks for.
 * Boundary: a type only; the web and native `useResourceActions` hold one while the modal is open.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3).
 */
import type { ActionRef } from "@stackra/clients";

/** The action whose modal form is open. */
export interface PendingAction {
  /** The action the form runs. */
  readonly action: ActionRef;

  /** The input key of the record id, when the action takes a record. */
  readonly idKey: string | undefined;

  /** The records the action runs on, when it takes a record. */
  readonly ids: readonly string[] | undefined;

  /** The record the form's values start from. */
  readonly record: object | undefined;

  /** The input keys the form asks for. */
  readonly keys: readonly string[];
}
