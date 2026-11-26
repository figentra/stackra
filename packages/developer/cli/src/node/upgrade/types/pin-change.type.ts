/**
 * Stackra file contract:
 * Purpose: `PinChange`, one `@stackra/*` version `bumpStackraPins` moves in a file's text.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */

/** A version moved. */
export type PinChange = {
  /** The package whose pin moved, such as `@stackra/actions`. */
  readonly name: string;

  /** The version before, prefix included (`^0.30.1`). */
  readonly from: string;

  /** The version after, the same prefix kept (`^0.33.1`). */
  readonly to: string;
};
