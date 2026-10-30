/**
 * Stackra file contract:
 * Purpose: `VoiceRecording`, what a `VoiceRecorderPort` hands back when it stops: the audio (a Blob on web; `null`
 *          from a driver that keeps no audio, such as the mock), its type and its length. No transcript: turning the
 *          audio into words is the app's.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** A finished recording. */
export interface VoiceRecording {
  /** The audio, or `null` when the driver keeps none. */
  readonly data: Blob | null;
  /** The audio's media type, for example `audio/webm`. */
  readonly mimeType: string;
  /** How long the recording ran, in milliseconds. */
  readonly durationMs: number;
}
