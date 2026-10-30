/**
 * Stackra file contract:
 * Purpose: the states of a `VoiceInput`: idle, asking for the microphone, listening, processing the recording, and the
 *          two ends that wait for another press: access denied, or an error.
 * Boundary: the values only; the moves between them are `nextVoiceInputState`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** The states of a voice input. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of here (ADR 0128); the states carry no labels.
export const VoiceInputState = Object.freeze([
  "idle",
  "requesting",
  "listening",
  "processing",
  "denied",
  "error",
] as const);

/** One state of a voice input. */
export type VoiceInputState = (typeof VoiceInputState)[number];
