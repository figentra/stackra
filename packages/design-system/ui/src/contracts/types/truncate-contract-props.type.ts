/**
 * Stackra file contract:
 * Purpose: `TruncateContractProps`, the props every runtime's `Truncate` takes: text clamped to a number of lines,
 *          with "Show more" to open it, or (on web) a tooltip with the whole text.
 * Boundary: types only; the toggle appears only when the text is really cut.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */

/** Props shared by the web and native `Truncate`. */
export interface TruncateContractProps {
  /** The text to clip and expand. */
  readonly children: string;
  /** How many lines show while closed; defaults to 3. */
  readonly lines?: number | undefined;
  /** `expand` (the default) adds Show more and Show less; `tooltip` shows the whole text on hover and focus (web; native expands). */
  readonly mode?: "expand" | "tooltip" | undefined;
  /** The starting state, for an uncontrolled expand. */
  readonly defaultExpanded?: boolean | undefined;
}
