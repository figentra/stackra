/**
 * Stackra file contract:
 * Purpose: `handoverSteps(handover)`, the call steps that hand a live call to a human: an optional announcement, the
 *          `handover` dial, and what happens when nobody answers in time (the caller's fallback steps, a hang-up by
 *          default).
 * Boundary: pure. The human's number, the ring time, the announcement and the fallback are the tenant's settings and
 *           translated text, passed in. A live call gets them with `VoiceGateway#redirect`; a new call's answer
 *           document with `VoiceGateway#answer`.
 * Runtime: isomorphic
 * Governing contract: PUT-216 (handover to a human); ADR 0376 (decision 7); STA-796.
 */
import type { CallInstruction } from "#contracts/types/call-instruction.type";
import type { SpeechVoice } from "#contracts/types/speech-voice.type";

/**
 * The handover steps.
 *
 * @throws RangeError for a ring time that is not a positive integer; TypeError for an announcement without a voice.
 * @example
 * await voice.redirect(ref, handoverSteps({ to: settings.handoverNumber, timeoutSeconds: 20, announce, speech }));
 */
export function handoverSteps(handover: {
  /** The human's number, E.164. */
  readonly to: `+${string}`;
  /** The caller id the human sees. */
  readonly callerId?: `+${string}`;
  /** Seconds to ring the human. */
  readonly timeoutSeconds: number;
  /** Said to the caller first ("connecting you to the team"), already translated. */
  readonly announce?: string;
  /** The voice of the announcement; required with `announce`. */
  readonly speech?: SpeechVoice;
  /** Steps when the human does not answer; a hang-up when left out. */
  readonly fallback?: readonly CallInstruction[];
}): CallInstruction[] {
  if (!Number.isInteger(handover.timeoutSeconds) || handover.timeoutSeconds <= 0)
    throw new RangeError("handoverSteps: the ring time must be a positive integer of seconds");
  const steps: CallInstruction[] = [];
  if (handover.announce !== undefined) {
    if (handover.speech === undefined)
      throw new TypeError("handoverSteps: an announcement needs its speech voice");
    steps.push({ kind: "say", text: handover.announce, speech: handover.speech });
  }
  steps.push({
    kind: "handover",
    to: handover.to,
    ...(handover.callerId === undefined ? {} : { callerId: handover.callerId }),
    timeoutSeconds: handover.timeoutSeconds,
  });
  steps.push(...(handover.fallback ?? [{ kind: "hang_up" } as const]));
  return steps;
}
