/**
 * Stackra file contract:
 * Purpose: `LiveValue<T>`, a value the memory platform owns and a test may write: the read half every facet hands out
 *          (`ReadonlySignal`) plus `set`.
 * Boundary: a type only; structurally a `@stackra/state` `Signal`, so `useSignal` reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (signals); ADR 0269 (fakes are real drivers).
 */
import type { ReadonlySignal } from "#contracts/types/readonly-signal.type";

/** A live value with its writer. */
export type LiveValue<T> = ReadonlySignal<T> & {
  /** Replaces the value and notifies subscribers; an equal value (`Object.is`) changes nothing. */
  set: (next: T) => void;
};
