/**
 * Stackra file contract:
 * Purpose: `ExtensionContext`, what every call context shares and what an extension's `handle` receives last: the
 *          call's id and key, the caller, the tenant, the scope node, the request's locale, time zone, currency and
 *          market, the request origin (ADR 0456), the abort signal and the frozen pipeline clock.
 * Boundary: a type only. `QueryContext` and `ActionContext` extend it, so an owner passes its own context to a slot;
 *           `RequestContext.current()` returns it inside any call. It carries no input and no record. The abort signal
 *           is `abortSignal`, because `signal(...)` is the workflow signal of an action. `scopeId` stays while
 *           @stackra/workflow's run origin carries it into event metadata; new code reads `scope`.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1: the handler context); ADR 0305 (rules 23 and 25: the slot call); ADR 0265
 *                     (decision 6: an extension runs inside the owner's call); ADR 0327 (decision 6: the current scope);
 *                     ADR 0456 (decision 1: the request origin).
 */
import type { Actor, PublicId, ScopeRef } from "@stackra/contracts";

import type { CallOrigin } from "#contracts/types/call-origin.type";

/** The context of one action or query call, as far as an extension sees it. */
export interface ExtensionContext {
  /** The call's id, shared by its audit entry and its log lines. */
  readonly callId: string;

  /** The locked identity of the running action or query (`orders.order.create@1`), else its written key. */
  readonly key: string;

  /** Who is calling; `actor.onBehalfOf ?? actor` is the subject of a delegated call. */
  readonly actor: Actor;

  /** The tenant the call acts in; absent for a platform call. */
  readonly scopeId?: PublicId;

  /** The scope node the call acts in (`{ id: "scp_…", path: "platform.acme" }`); absent for a platform call. */
  readonly scope?: ScopeRef;

  /** The request's locale (`en`, `ar-SA`). */
  readonly locale: string;

  /** The request's IANA time zone (`Asia/Riyadh`), which day and period boundaries follow. */
  readonly timeZone: string;

  /** The request's ISO 4217 currency (`SAR`). */
  readonly currency: string;

  /** The request's market code, which prices are quoted in. */
  readonly market: string;

  /** The surface the call arrived through (storefront, console, API key, agent); absent for an internal call. */
  readonly origin?: CallOrigin;

  /** Aborted when the caller goes away or the call's deadline passes. */
  readonly abortSignal: AbortSignal;

  /** The pipeline clock: one instant for the whole call, read from the Clock port when the call started. */
  now: () => Date;
}
