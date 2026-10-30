/**
 * Stackra file contract:
 * Purpose: proves the VoiceInput state machine: start asks, granted listens, denied and failures wait for another
 *          press, stop processes, processed returns to idle, cancel drops back, and anything else changes nothing.
 * Boundary: the pure function only.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D).
 */
import type { VoiceInputEvent } from "#contracts/types/voice-input-event.type";
import { nextVoiceInputState } from "#core/functions/next-voice-input-state.function";
import type { VoiceInputState } from "#contracts/enums/voice-input-state.enum";

/** Runs the events from idle and lists the states passed through. */
const run = (...events: VoiceInputEvent[]) => {
  const states: VoiceInputState[] = [];
  events.reduce<VoiceInputState>((state, event) => {
    const next = nextVoiceInputState(state, event);
    states.push(next);
    return next;
  }, "idle");
  return states;
};

describe("nextVoiceInputState", () => {
  it("records, processes and returns to idle", () => {
    expect(run("start", "granted", "stop", "processed")).toEqual([
      "requesting",
      "listening",
      "processing",
      "idle",
    ]);
  });

  it("waits in denied or error until pressed again", () => {
    expect(run("start", "denied", "stop", "start")).toEqual([
      "requesting",
      "denied",
      "denied",
      "requesting",
    ]);
    expect(run("start", "granted", "failed", "start")).toEqual([
      "requesting",
      "listening",
      "error",
      "requesting",
    ]);
    expect(nextVoiceInputState("processing", "failed")).toBe("error");
  });

  it("cancels while asking or listening, never while processing", () => {
    expect(nextVoiceInputState("requesting", "cancel")).toBe("idle");
    expect(nextVoiceInputState("listening", "cancel")).toBe("idle");
    expect(nextVoiceInputState("processing", "cancel")).toBe("processing");
  });

  it("ignores events a state does not take", () => {
    expect(nextVoiceInputState("idle", "stop")).toBe("idle");
    expect(nextVoiceInputState("listening", "start")).toBe("listening");
  });
});
