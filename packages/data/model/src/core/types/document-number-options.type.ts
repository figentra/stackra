/**
 * Stackra file contract:
 * Purpose: `DocumentNumberOptions`, what `@DocumentNumber` declares: the gapless sequence that numbers the field.
 * Boundary: a type only. `sequence` is the sequence's written key (`invoice`) in the model's own module, or its full
 *           key (`billing.invoice`) for a sequence another module or package declares; gen resolves it against the
 *           member's sequences and refuses a field whose sequence is not there (ADR 0342 enforcement).
 * Runtime: isomorphic
 * Governing contract: ADR 0342 (decisions 1, 3 and 5).
 */

/** The options of `@DocumentNumber`. */
export interface DocumentNumberOptions {
  /** The sequence's written key (`invoice`) or full key (`billing.invoice`). */
  readonly sequence: string;
}
