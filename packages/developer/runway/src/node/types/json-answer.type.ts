/**
 * Stackra file contract:
 * Purpose: `JsonAnswer`, one HTTP answer of a store API as `requestJson` hands it over: the status and the parsed body.
 * Boundary: type only. A body may carry a secret the caller asked for (a created key); the caller never logs it.
 * Runtime: node
 * Governing contract: ADR 0482 (decision 4).
 */

/** One HTTP answer. */
export type JsonAnswer = {
  /** The HTTP status. */
  readonly status: number;
  /** The parsed JSON body, `{}` when empty. */
  readonly body: Record<string, unknown>;
};
