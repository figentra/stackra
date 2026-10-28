/**
 * Stackra file contract:
 * Purpose: `Speech`, the speech provider port: streaming speech to text (`listen`) and streaming text to speech
 *          (`speak`) over raw audio, and whether the provider keeps the audio it hears.
 * Boundary: an interface a Connection implements, not a container port, as `VoiceGateway` is: the tenant's own
 *           Connection, or the platform one of the tenant's data region (`region-map:<region>.providers.speech`),
 *           serves each stream, chosen by `SpeechService` through `ProviderResolver` under the `speech` capability.
 *           Split from `VoiceGateway` (ADR 0376 decision 7): a call's audio, a device microphone and a till speaker
 *           all reach the same port. Vendor Connections live in the OS integrations service (R3-8).
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decisions 2 and 7); R3-SO-11; PUT-216; RES-240.
 */
import type { SpeechRequest } from "#contracts/voice/speech-request.type";
import type { Transcript } from "#contracts/voice/transcript.type";

/**
 * A speech provider account.
 *
 * @example
 * for await (const heard of speech.listen(microphone, request)) if (heard.final) reply(heard.text);
 */
export interface Speech {
  /**
   * Whether the provider keeps the audio or text after the stream; a health or privileged stream asks for a provider
   * that does not (`SpeechSession.zeroRetention`).
   */
  readonly retainsAudio: boolean;

  /** Recognises `audio` (raw, in `request.format`) as it arrives, yielding interim and final transcripts. */
  listen: (audio: AsyncIterable<Uint8Array>, request: SpeechRequest) => AsyncIterable<Transcript>;

  /** Synthesises `text` (already translated) in `request.speech`, yielding raw audio in `request.format`. */
  speak: (text: string, request: SpeechRequest) => AsyncIterable<Uint8Array>;
}
