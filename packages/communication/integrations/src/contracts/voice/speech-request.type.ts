/**
 * Stackra file contract:
 * Purpose: `SpeechRequest`, how one recognition or synthesis stream runs: the language and voice, the raw audio format,
 *          the words the recogniser should expect, and the signal that stops it.
 * Boundary: a type only. Language and voice come from data (`VoicePack#voice`: the Market pack's dialects and the
 *           tenant's chosen voice); nothing here picks one.
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decision 7); PUT-216; OS-428 (Arabic dialects in the market pack).
 */
import type { SpeechVoice } from "#contracts/types/speech-voice.type";
import type { AudioFormat } from "#contracts/voice/audio-format.type";

/** One speech stream's settings. */
export interface SpeechRequest {
  /** The language (dialect) and the synthesis voice. */
  readonly speech: SpeechVoice;

  /** The format of the audio sent to recognition, or wanted back from synthesis. */
  readonly format: AudioFormat;

  /** Words the recogniser should expect (menu items, service and staff names). */
  readonly hints?: readonly string[];

  /** Ends the stream early (the caller hung up, the lane closed). */
  readonly signal?: AbortSignal;
}
