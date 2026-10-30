/**
 * Stackra file contract:
 * Purpose: `MediaRangeProps`, the props of the MediaPlayer's internal `MediaRange` (the timeline and the volume).
 * Boundary: types only; internal to the media player.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** Props of a MediaRange. */
export interface MediaRangeProps {
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
  /** What one arrow key moves. Page Up and Page Down move ten times as far. */
  readonly step: number;
  /** Called with the new position. */
  readonly onChange: (value: number) => void;
  /** Styles the track. */
  readonly className?: string | undefined;
}
