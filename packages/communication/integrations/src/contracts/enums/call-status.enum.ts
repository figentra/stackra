/**
 * Stackra file contract:
 * Purpose: `CallStatus`, the normalised state of a phone call across telephony providers.
 * Boundary: an `Enum.of` value plus the type of the same name. A provider's own state maps to one of these in its
 *           driver; `Enum.meta(CallStatus, s).final` says whether the call is over.
 * Runtime: isomorphic
 * Governing contract: PUT-216 (voice channel); ADR 0223 (decision 1: voice); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** Call states; `final` marks the ones a call never leaves. */
export const CallStatus = Enum.of({
  /** Accepted by the provider, not dialled yet. */
  Queued: ["queued", { final: false }],
  /** Ringing at the far end. */
  Ringing: ["ringing", { final: false }],
  /** Answered and connected. */
  InProgress: ["in_progress", { final: false }],
  /** Ended after it was answered. */
  Completed: ["completed", { final: true }],
  /** The far end was busy. */
  Busy: ["busy", { final: true }],
  /** Nobody answered. */
  NoAnswer: ["no_answer", { final: true }],
  /** The provider could not place it. */
  Failed: ["failed", { final: true }],
  /** Cancelled before it was answered. */
  Cancelled: ["cancelled", { final: true }],
});

/** One of the codes above. */
export type CallStatus = Enum.Value<typeof CallStatus>;
