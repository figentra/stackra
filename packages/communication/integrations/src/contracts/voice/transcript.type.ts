/**
 * Stackra file contract:
 * Purpose: `Transcript`, one result of streaming speech recognition: the text heard so far in the current utterance or
 *          its final form, the recogniser's confidence and the language it heard.
 * Boundary: a type only. What a caller said is personal data: it is returned to the caller and never logged here.
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decision 7: the Speech port); ADR 0134 (personal data).
 */

/** A recognition result. */
export interface Transcript {
  /** The words heard. */
  readonly text: string;

  /** True when the utterance is over and `text` will not change; false for an interim guess. */
  readonly final: boolean;

  /** The BCP 47 tag of what was heard (an Arabic dialect is a regional tag: `ar-SA`). */
  readonly language: string;

  /** The recogniser's confidence from 0 to 1, when it reports one. */
  readonly confidence?: number;
}
