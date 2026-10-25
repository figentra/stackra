/**
 * Stackra file contract:
 * Purpose: `SpeechVoice`, the language (an Arabic dialect is a regional tag: `ar-SA`, `ar-AE`, `ar-EG`) and the
 *          provider voice a call speaks and listens in.
 * Boundary: a type only. Both come from data: the dialects a Market speaks are in its market pack, the voice from the
 *           tenant's settings; nothing here picks one.
 * Runtime: isomorphic
 * Governing contract: PUT-216; OS-428 (Arabic dialects in the market pack).
 */

/** How a call speaks and listens. */
export interface SpeechVoice {
  /** The BCP 47 tag the provider's speech recognition and synthesis use. */
  readonly language: string;

  /** The provider's voice name for synthesis; its default for the language when left out. */
  readonly voice?: string;
}
