/**
 * Stackra file contract:
 * Purpose: `BlockKit`, a reviewed block kit: the block keys a builder may offer for one surface, such as the blocks a
 *          partner theme's sections may use after the app market's review.
 * Boundary: a type only. The host builds it from review records (`@stackra/registry`'s approved app versions) and the
 *           first-party blocks it trusts; the editor offers and inserts nothing outside it. A kit never adds a block
 *           the code does not register.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 3: the palette is code); ADR 0355 (decision 8: review before listing);
 *                     COM-358.
 */

/** A reviewed set of blocks. */
export interface BlockKit {
  /** The kit's key (`theme_sections`). */
  readonly key: string;

  /** The block keys the kit allows. */
  readonly blocks: readonly string[];
}
