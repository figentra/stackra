/**
 * Stackra file contract:
 * Purpose: `VoiceInputEvent`, what moves a `VoiceInput` between states: a press to start or stop, the microphone
 *          granted or denied, a failure, the recording processed, or a cancel.
 * Boundary: types only; `nextVoiceInputState` applies them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** One event of a voice input. */
export type VoiceInputEvent =
  | "start"
  | "granted"
  | "denied"
  | "failed"
  | "stop"
  | "processed"
  | "cancel";
