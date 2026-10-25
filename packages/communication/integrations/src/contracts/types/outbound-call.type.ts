/**
 * Stackra file contract:
 * Purpose: `OutboundCall`, a call to place: who to call, the number it comes from, where the provider asks what to do
 *          once answered, where it reports status, and whether it is recorded.
 * Boundary: a type only. `record` is the outcome of `recordingPlan` (the Market's consent rule and the tenant's
 *           setting), never a default.
 * Runtime: isomorphic
 * Governing contract: PUT-216; ADR 0223 (decision 1: voice through Twilio).
 */
import type { Url } from "@stackra/contracts";

/** A call to place. */
export interface OutboundCall {
  /** Our reference for the call (an appointment reminder's id). */
  readonly reference: string;

  /** Who is called, E.164. */
  readonly to: `+${string}`;

  /** The number it comes from, E.164, one the account owns. */
  readonly from: `+${string}`;

  /** Our webhook URL that answers with the call's instructions once it is picked up. */
  readonly instructionsUrl: Url;

  /** Our webhook URL for status changes. */
  readonly statusUrl?: Url;

  /** Whether to record from the answer. */
  readonly record: boolean;

  /** Seconds to ring before giving up. */
  readonly timeoutSeconds?: number;
}
