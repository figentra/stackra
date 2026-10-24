/**
 * Stackra file contract:
 * Purpose: `CallOptions`, what a transport hands `ActionPipeline.execute` beside the class and the input: the verified
 *          caller, the Idempotency-Key header, the request's locale, time zone, currency and market, the call id and
 *          the abort signal.
 * Boundary: a type only. The actor comes from the verified credential, never from a request body (ADR 0098). Absent
 *           values take the pipeline's defaults (`en`, `UTC`, `USD`, market `default`, a fresh call id).
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1); ADR 0098 (decisions 6 and 7: the typed actor).
 */
import type { Actor } from "@stackra/contracts";

/** The call-level facts of one invocation. */
export interface CallOptions {
  /** The verified caller. */
  readonly actor: Actor;

  /** The `Idempotency-Key` the client sent. */
  readonly idempotencyKey?: string;

  /** The request's locale. */
  readonly locale?: string;

  /** The request's IANA time zone. */
  readonly timeZone?: string;

  /** The request's ISO 4217 currency. */
  readonly currency?: string;

  /** The request's market code. */
  readonly market?: string;

  /** The call id, when the transport already has one (a trace id). */
  readonly callId?: string;

  /** Aborted when the caller goes away. */
  readonly abortSignal?: AbortSignal;
}
