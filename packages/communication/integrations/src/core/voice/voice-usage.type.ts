/**
 * Stackra file contract:
 * Purpose: `VoiceUsage`, whom a call's or a speech stream's usage is billed to: our reference for it, the scope node
 *          that pays and who started it.
 * Boundary: a type only. The reference becomes the usage event's call id, so one call or stream is metered once.
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decision 2); R3-SO-11.
 */
import type { Actor } from "@stackra/contracts";

/** The billing side of one call or stream. */
export interface VoiceUsage {
  /** Our id of the call or stream (a provider call id, a lane session id). */
  readonly reference: string;

  /** The scope node's public id that pays; absent for a platform call. */
  readonly scopeId?: string;

  /** Who started it. */
  readonly actor?: Actor;
}
