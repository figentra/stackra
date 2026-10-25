/**
 * Stackra file contract:
 * Purpose: `recordingPlan(input)`, whether a call is recorded and what the caller hears first, from the Market's
 *          consent rule (pack data), the tenant's wish to record (a setting) and, under an explicit rule, the caller's
 *          answer.
 * Boundary: pure. Nothing is recorded under an explicit rule until the caller says yes; a tenant that does not record
 *           never asks or warns.
 * Runtime: isomorphic
 * Governing contract: PUT-216 (call recording consent from the pack); owner principle 2026-10-25 (legal floors are
 *                     pack data).
 */
import { RecordingConsent } from "#contracts/enums/recording-consent.enum";

/**
 * The recording decision.
 *
 * @example
 * recordingPlan({ rule: RecordingConsent.Explicit, wanted: true }); // { record: false, notice: false, ask: true }
 * recordingPlan({ rule: RecordingConsent.Notice, wanted: true }); // { record: true, notice: true, ask: false }
 */
export function recordingPlan(input: {
  readonly rule: RecordingConsent;
  readonly wanted: boolean;
  readonly consented?: boolean;
}): { readonly record: boolean; readonly notice: boolean; readonly ask: boolean } {
  if (!input.wanted) return { record: false, notice: false, ask: false };
  switch (input.rule) {
    case RecordingConsent.NotRequired:
      return { record: true, notice: false, ask: false };
    case RecordingConsent.Notice:
      return { record: true, notice: true, ask: false };
    case RecordingConsent.Explicit:
      return input.consented === undefined
        ? { record: false, notice: false, ask: true }
        : { record: input.consented, notice: false, ask: false };
  }
}
