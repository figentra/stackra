/**
 * Stackra file contract:
 * Purpose: `AmountWordsUnavailableError` (`amount_words_unavailable`), the refusal to spell an amount in a language
 *          with no speller, or for a currency whose market-pack names lack that language or its minor unit.
 * Boundary: a precondition refusal (412), never retryable: the market pack or the template must change.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 3); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The amount cannot be spelled in this language. */
export class AmountWordsUnavailableError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The language subtag asked for (`ar`, `fr`). */
  language!: string;
}
