/**
 * Stackra file contract:
 * Purpose: `MediaTrack`, one captions file of a MediaPlayer: a WebVTT file, its language and the name people pick.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: WCAG 2.2 SC 1.2.2 (captions); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** A captions track. */
export interface MediaTrack {
  /** The WebVTT file's address. */
  readonly src: string;
  /** Its language tag, for example `ar` or `en`. */
  readonly language: string;
  /** Its name, for example "العربية" or "English". */
  readonly label: string;
}
