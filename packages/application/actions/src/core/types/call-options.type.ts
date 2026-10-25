/**
 * Stackra file contract:
 * Purpose: `CallOptions`, what a transport hands `ActionPipeline.execute` beside the class and the input: the verified
 *          caller, the scope it acts in, the Idempotency-Key header, the request's locale, time zone, currency and
 *          market, the call id, the abort signal and the device the call came from (with its sequence for a call
 *          replayed from the device's offline queue).
 * Boundary: a type only. The actor comes from the verified credential, never from a request body (ADR 0098); the scope
 *           is the one the resolver chain settled on, never request input (ADR 0327 decision 7); the device order is
 *           set only once the transport matched its device id to the verified session's device (the header names are
 *           `DEVICE_ORDER` of `@stackra/clients`). Absent values take the pipeline's defaults (`en`, `UTC`, `USD`,
 *           market `default`, a fresh call id); no scope is a platform call. A replica query's change cursor is its
 *           input's `cursor`, not a call fact.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1); ADR 0098 (decisions 6 and 7: the typed actor); ADR 0327 (decisions 6 and
 *                     7: the current scope is part of the call); ADR 0338 (decisions 1 and 4).
 */
import type { Actor, ScopeRef } from "@stackra/contracts";

import type { DeviceOrder } from "#contracts/types/device-order.type";

/** The call-level facts of one invocation. */
export interface CallOptions {
  /** The verified caller. */
  readonly actor: Actor;

  /** The scope node the call acts in; absent for a platform call. */
  readonly scope?: ScopeRef;

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

  /** The verified device the call came from; with a sequence, a call replayed from its queue and applied in order. */
  readonly device?: DeviceOrder;
}
