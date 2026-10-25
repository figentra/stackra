/**
 * Stackra file contract:
 * Purpose: `RecordingConsent`, what a Market's law asks before a call is recorded: nothing, a notice the caller hears,
 *          or the caller's explicit yes.
 * Boundary: an `Enum.of` value plus the type of the same name. Which rule a Market has is market-pack data (the call
 *           recording consent rule, a legal floor); whether a tenant records at all is its setting. `recordingPlan`
 *           combines them.
 * Runtime: isomorphic
 * Governing contract: PUT-216 (call recording consent from the pack); owner principle 2026-10-25 (legal floors from
 *                     market-pack data); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * The consent rules.
 *
 * @example
 * const rule = valueOf(pack, "messaging.call_recording_consent", today).value as RecordingConsent;
 */
export const RecordingConsent = Enum.of({
  /** The law asks nothing before recording. */
  NotRequired: "not_required",
  /** The caller must hear that the call is recorded. */
  Notice: "notice",
  /** The caller must say yes first; without it, nothing is recorded. */
  Explicit: "explicit",
});

/** One of the codes above. */
export type RecordingConsent = Enum.Value<typeof RecordingConsent>;
