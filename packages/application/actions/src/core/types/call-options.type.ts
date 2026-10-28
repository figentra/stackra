/**
 * Stackra file contract:
 * Purpose: `CallOptions`, what a transport hands `ActionPipeline.execute` beside the class and the input: the verified
 *          caller, the scope it acts in, the Idempotency-Key header, the request's locale, time zone, currency and
 *          market, the call id, the abort signal and the device the call came from (with its sequence for a call
 *          replayed from the device's offline queue), the verified assurance of the caller's last authentication,
 *          whether the call runs in a sandbox, the network client it came from (STA-1248), and the product surface it
 *          arrived through (`origin`: storefront, console, API key, agent; ADR 0456), and the signed consent snapshot
 *          the client sent (`consentSnapshot`, ADR 0472), and the caller's last write the transport carried
 *          (`lastWriteAt`, the read-your-writes window of a replica query).
 * Boundary: a type only. The actor comes from the verified credential, never from a request body (ADR 0098); the scope
 *           is the one the resolver chain settled on, never request input (ADR 0327 decision 7); the device order is
 *           set only once the transport matched its device id to the verified session's device (the header names are
 *           `DEVICE_ORDER` of `@stackra/clients`). Absent values take the pipeline's defaults (`en`, `UTC`, `USD`,
 *           market `default`, a fresh call id); no scope is a platform call. The consent snapshot is passed as sent and
 *           is never trusted here: the pipeline verifies it through `ConsentCheck` before `ctx.consent()` reads it. A replica query's change cursor is its
 *           input's `cursor`, not a call fact.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1); ADR 0098 (decisions 6 and 7: the typed actor); ADR 0327 (decisions 6 and
 *                     7: the current scope is part of the call); ADR 0338 (decisions 1 and 4); ADR 0456 (decision 1); ADR
 *                     0472 (decision 3: the consent snapshot travels with the call).
 */
import type { Actor, ScopeRef } from "@stackra/contracts";

import type { CallAssurance } from "#contracts/types/call-assurance.type";
import type { CallClient } from "#contracts/types/call-client.type";
import type { CallOrigin } from "#contracts/types/call-origin.type";
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

  /** The id of a granted approval this call resubmits under, from an earlier `approval_required` refusal. */
  readonly approvalId?: string;

  /** The verified assurance of the caller's last authentication, from the token; absent without a session. */
  readonly assurance?: CallAssurance;

  /**
   * Whether the call runs in the tenant's sandbox (a private app installed for trial, OS-132); set by the transport
   * from the verified credential or the sandbox host, never from request input. Absent is a live call.
   */
  readonly sandbox?: boolean;

  /** The network client the call came from, from the connection or the edge's trusted forwarding; never input. */
  readonly client?: CallClient;

  /**
   * The surface the call arrived through (storefront, console, API key, agent), set by the transport from the verified
   * credential, never from input. Absent for an internal call (a job, a workflow step).
   */
  readonly origin?: CallOrigin;

  /**
   * The record version the client last read, from the `If-Match` header (or a `version` field the transport lifts out
   * of the input); the action's `ctx.expectedVersion`. Absent when the client sent none.
   */
  readonly expectedVersion?: number;

  /**
   * The signed consent snapshot the client sent in the `Stackra-Consent` header (or an ingest envelope), as sent;
   * unverified here. Absent when the client sent none, which reads as refused.
   */
  readonly consentSnapshot?: string;

  /**
   * When the caller's last action committed, as the transport carried it (a short-lived cookie or header the
   * transport sets on a committed action's answer). It only keeps a `reads: "replica"` query on the primary inside
   * the read-your-writes window, so a forged value costs a replica read and nothing else. Absent when none was sent.
   */
  readonly lastWriteAt?: Date;
}
