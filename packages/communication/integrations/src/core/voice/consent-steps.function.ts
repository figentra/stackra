/**
 * Stackra file contract:
 * Purpose: `consentSteps(plan, text, speech, listen)`, the call steps that carry out a recording plan before the
 *          conversation: the notice the caller hears, or the question and the listen step whose answer comes back to
 *          `listen.actionUrl`; none when the plan asks nothing.
 * Boundary: pure. The wording is the pack's (`VoicePack#consentText`); a plan that needs a notice or a question whose
 *           text is missing refuses rather than skip a legal floor. Understanding the caller's yes or no is the
 *           caller's (its conversation), which then calls `recordingPlan` again with `consented` and `record`s or not.
 * Runtime: isomorphic
 * Governing contract: PUT-216 (call recording consent from the pack); RV-51; US-111 (consent before recording).
 */
import type { Url } from "@stackra/contracts";

import type { CallInstruction } from "#contracts/types/call-instruction.type";
import type { SpeechVoice } from "#contracts/types/speech-voice.type";

/**
 * The consent steps.
 *
 * @throws TypeError when the plan needs a notice or a question and its text is missing.
 * @example
 * const plan = await voicePack.plan("sa", true);
 * const steps = consentSteps(plan, await voicePack.consentText("sa", speech.language), speech, { actionUrl, timeoutSeconds: 5 });
 */
export function consentSteps(
  plan: { readonly notice: boolean; readonly ask: boolean },
  text: { readonly notice?: string; readonly ask?: string },
  speech: SpeechVoice,
  listen: { readonly actionUrl: Url; readonly timeoutSeconds: number },
): CallInstruction[] {
  if (plan.ask) {
    if (text.ask === undefined)
      throw new TypeError(
        "consentSteps: the pack has no recording consent question for this language",
      );
    return [
      { kind: "say", text: text.ask, speech },
      {
        kind: "listen",
        speech,
        actionUrl: listen.actionUrl,
        timeoutSeconds: listen.timeoutSeconds,
      },
    ];
  }
  if (plan.notice) {
    if (text.notice === undefined)
      throw new TypeError("consentSteps: the pack has no recording notice for this language");
    return [{ kind: "say", text: text.notice, speech }];
  }
  return [];
}
