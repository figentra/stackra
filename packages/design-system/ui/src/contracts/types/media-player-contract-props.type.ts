/**
 * Stackra file contract:
 * Purpose: `MediaPlayerContractProps`, the props of the `MediaPlayer`: a video or audio file with the house controls
 *          (play, seek with what is buffered, the time, mute and volume, speed, captions and full screen).
 * Boundary: types only. Web only for now: the mobile app has no media dependency (expo-video or expo-audio), so there is
 *           no native player until one is approved.
 * Direction: the controls row and the timeline stay left to right in every language, as on YouTube and the system
 *            players: time runs left to right on a media timeline, and ←/→ seek back and forward by the arrow's
 *            direction. The play icon is never mirrored. Words (names, the speed menu) follow the locale.
 * Runtime: isomorphic
 * Governing contract: WCAG 2.2 SC 1.2.2, 2.1.1 and 4.1.2; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { MediaTrack } from "#contracts/types/media-track.type";

/** Props of the `MediaPlayer`. */
export interface MediaPlayerContractProps {
  /** The file's address. */
  readonly src: string;
  /** `video` (the default) or `audio`. */
  readonly kind?: "video" | "audio" | undefined;
  /** The player's accessible name, for example the video's title. */
  readonly label: string;
  /** A still shown before a video plays. */
  readonly poster?: string | undefined;
  /** Captions files; with any, a captions button appears and shows the one in the reader's language, else the first. */
  readonly tracks?: readonly MediaTrack[] | undefined;
  /** The speeds the speed menu offers; defaults to 0.5, 1, 1.25, 1.5 and 2. */
  readonly playbackRates?: readonly number[] | undefined;
  /** Called once the file plays to its end. */
  readonly onEnded?: (() => void) | undefined;
}
