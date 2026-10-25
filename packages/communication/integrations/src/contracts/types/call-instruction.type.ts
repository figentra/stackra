/**
 * Stackra file contract:
 * Purpose: `CallInstruction`, one step of what a call does next, provider-neutral: say text, play audio, listen for
 *          speech (speech to text, posted to our URL), hand over to a human's number, or hang up. A driver renders
 *          a list of them as its provider's answer document (TwiML for Twilio).
 * Boundary: a type only, a discriminated union on `kind`. Text is already translated; language and voice come from
 *           `SpeechVoice` data.
 * Runtime: isomorphic
 * Governing contract: PUT-216 (Arabic speech, handover to a human); ADR 0223 (decision 1: voice).
 */
import type { Url } from "@stackra/contracts";

import type { SpeechVoice } from "#contracts/types/speech-voice.type";

/**
 * One step of a call.
 *
 * @example
 * const steps: CallInstruction[] = [
 *   { kind: "say", text: greeting, speech },
 *   { kind: "listen", speech, actionUrl, timeoutSeconds: 5 },
 * ];
 */
export type CallInstruction =
  | {
      /** Speak `text` (text to speech). */
      readonly kind: "say";
      readonly text: string;
      readonly speech: SpeechVoice;
    }
  | {
      /** Play an audio file. */
      readonly kind: "play";
      readonly url: Url;
    }
  | {
      /** Listen for speech and post what was heard to `actionUrl` (speech to text). */
      readonly kind: "listen";
      readonly speech: SpeechVoice;
      readonly actionUrl: Url;
      /** Seconds of silence that end the turn. */
      readonly timeoutSeconds: number;
      /** Words the recogniser should expect (service names, staff names). */
      readonly hints?: readonly string[];
    }
  | {
      /** Hand the call over to a human at `to`. */
      readonly kind: "handover";
      readonly to: `+${string}`;
      /** The caller id shown to the human. */
      readonly callerId?: `+${string}`;
      readonly timeoutSeconds: number;
    }
  | {
      /** End the call. */
      readonly kind: "hang_up";
    };
