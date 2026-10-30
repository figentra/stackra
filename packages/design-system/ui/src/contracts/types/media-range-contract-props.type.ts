/**
 * Stackra file contract:
 * Purpose: `MediaRangeContractProps`, the props of the MediaPlayer's internal `MediaRange` (the timeline and the
 *          volume) on web and native.
 * Boundary: types only; internal to the media players, so the contracts entry does not export it.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-1371 (owner approval
 *          2026-10-30).
 */

/** Props of a MediaRange. */
export interface MediaRangeContractProps {
  /** The position, 0 to `max`. */
  readonly value: number;
  /** The end of the range (the length in seconds, or 1 for the volume). */
  readonly max: number;
  /** How far the file is loaded, drawn behind the fill; leave it out for none. */
  readonly buffered?: number | undefined;
  /** The accessible name. */
  readonly label: string;
  /** What a screen reader says for the value, for example "0:12 of 1:05". */
  readonly valueText: string;
  /** What one step moves: an arrow key (Page Up and Down move ten times as far), or a screen reader's swipe. */
  readonly step: number;
  /** Called with the new position. */
  readonly onChange: (value: number) => void;
  /** Styles the track. */
  readonly className?: string | undefined;
}
