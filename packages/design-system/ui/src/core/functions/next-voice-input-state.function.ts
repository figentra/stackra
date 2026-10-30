/**
 * Stackra file contract:
 * Purpose: `nextVoiceInputState`, the VoiceInput's state machine: the state an event moves it to. A press starts from
 *          idle, denied or error; the microphone answer moves requesting to listening or denied; a stop moves listening
 *          to processing and `processed` back to idle; a failure from any working state is an error; a cancel drops
 *          back to idle. An event a state does not take leaves it as it is.
 * Boundary: a pure function; the recorder and the words are the components'.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { VoiceInputState } from "#contracts/enums/voice-input-state.enum";
import type { VoiceInputEvent } from "#contracts/types/voice-input-event.type";

/** The moves each state takes; anything else is ignored. */
const MOVES: Readonly<
  Record<VoiceInputState, Partial<Readonly<Record<VoiceInputEvent, VoiceInputState>>>>
> = {
  idle: { start: "requesting" },
  requesting: { granted: "listening", denied: "denied", failed: "error", cancel: "idle" },
  listening: { stop: "processing", failed: "error", cancel: "idle" },
  processing: { processed: "idle", failed: "error" },
  denied: { start: "requesting" },
  error: { start: "requesting" },
};

/** The state `event` moves `state` to. */
export function nextVoiceInputState(
  state: VoiceInputState,
  event: VoiceInputEvent,
): VoiceInputState {
  return MOVES[state][event] ?? state;
}
