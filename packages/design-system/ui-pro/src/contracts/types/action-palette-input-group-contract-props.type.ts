/**
 * Stackra file contract:
 * Purpose: `ActionPaletteInputGroupContractProps`, props of `ActionPalette.InputGroup` that the Stackra vocabulary
 *          names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0294 (decision 23:
 *                     Command is a CLI command only); STA-403 FR-004.
 */

/** Props of `ActionPalette.InputGroup` that the Stackra vocabulary names. */
export interface ActionPaletteInputGroupContractProps {
  /** The accessible name of the search field; HeroUI Pro's `aria-label`, which defaults to "Search commands". */
  readonly label?: string | undefined;
}
