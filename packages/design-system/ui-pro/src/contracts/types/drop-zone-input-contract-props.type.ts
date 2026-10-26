/**
 * Stackra file contract:
 * Purpose: `DropZoneInputContractProps`, props of `DropZone.Input` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */

/** Props of `DropZone.Input` that the Stackra vocabulary names. */
export interface DropZoneInputContractProps {
  /** The accessible name of the file input, read by screen readers; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
  /** True to disable the file input; the native `disabled` attribute. */
  readonly isDisabled?: boolean | undefined;
}
