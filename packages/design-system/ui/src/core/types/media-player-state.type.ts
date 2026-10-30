/**
 * Stackra file contract:
 * Purpose: `MediaPlayerState`, what a MediaPlayer's controls show, as the platform player last reported it: playing or
 *          not, the time, the length, what is loaded, the volume and mute, the speed and whether captions are on.
 * Boundary: types only; the web and native players keep it through `useMediaPlayerState`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-1371 (owner approval
 *          2026-10-30).
 */

/** The state a MediaPlayer's controls show. */
export interface MediaPlayerState {
  /** Whether the file is playing. */
  readonly isPlaying: boolean;
  /** The position, in seconds. */
  readonly time: number;
  /** The length, in seconds; 0 until known. */
  readonly duration: number;
  /** How far the file is loaded, in seconds. */
  readonly buffered: number;
  /** The volume, of 1. */
  readonly volume: number;
  /** Whether the sound is off. */
  readonly isMuted: boolean;
  /** The speed, 1 being normal. */
  readonly rate: number;
  /** Whether captions are showing. */
  readonly hasCaptions: boolean;
}
