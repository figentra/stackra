/**
 * Stackra file contract:
 * Purpose: `ReplayOutcome`, what one replay of a queued call came to, as `MutationSender.send` reports it: accepted,
 *          refused for good (a conflict record), or not reached (the entry waits for the next drain).
 * Boundary: a type only. A refusal for good carries the envelope's code and, for a `409`, the server's current record
 *           from its details, so the conflict record holds both the local intent and the server state (ADR 0059
 *           decision 3). Offline, `401`, `429` and `5xx` are not refusals for good: `code` is `null` and nothing is
 *           dropped.
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (decisions 2 and 3); ADR 0140 (envelope); ADR 0294 (decision 8: named types).
 */
import type { Json } from "@stackra/contracts";

/**
 * The result of sending one queued call.
 *
 * @example
 * return { ok: false, code: envelope.code, server: envelope.details?.current ?? null }; // a 409
 */
export interface ReplayOutcome {
  /** True when the server accepted the call; the entry leaves the queue. */
  readonly ok: boolean;

  /**
   * When not accepted: the refusal code that makes the call a conflict (`version_conflict`, `forbidden`,
   * `entitlement_required`), or `null` when the server was not reached or may answer differently later.
   */
  readonly code: string | null;

  /** The server's current record from a `409` envelope's details; `null` otherwise. */
  readonly server: Json | null;
}
