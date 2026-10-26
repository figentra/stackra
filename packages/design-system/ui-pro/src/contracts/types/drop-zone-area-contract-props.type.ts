/**
 * Stackra file contract:
 * Purpose: `DropZoneAreaContractProps`, props of `DropZone.Area` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */

/**
 * Stackra file contract:
 * Purpose: the props the web `DropZone` parts take from the shared vocabulary: the accessible name (`label`) and the
 *          disabled state (`isDisabled`) of the drop area and of the file input (where HeroUI Pro's own name for the
 *          state is the native `disabled`). The root and every other part are HeroUI Pro's own and pass through
 *          unchanged.
 * Boundary: types only; web only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */

/** Props of `DropZone.Area` that the Stackra vocabulary names. */
export interface DropZoneAreaContractProps {
  /** The accessible name of the drop area, read by screen readers; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
  /** True to refuse dropped files and show the disabled style. */
  readonly isDisabled?: boolean | undefined;
}
