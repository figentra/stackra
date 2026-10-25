/**
 * Stackra file contract:
 * Purpose: `TranslationRequest`, what a `TranslationProvider` is asked: ICU messages in a source locale, to a target
 *          locale, in order.
 * Boundary: a type only. Messages are ICU (ADR 0268 R15): a driver keeps every `{placeholder}` and plural or select
 *           branch intact. Keys never travel: they never change (ADR 0236 decision 6).
 * Runtime: isomorphic
 * Governing contract: ADR 0236; ADR 0268 (R15).
 */

/** A batch of messages to translate. */
export interface TranslationRequest {
  /** The ICU messages, in order. */
  readonly messages: readonly string[];

  /** The BCP 47 locale they are written in. */
  readonly from: string;

  /** The BCP 47 locale wanted. */
  readonly to: string;
}
