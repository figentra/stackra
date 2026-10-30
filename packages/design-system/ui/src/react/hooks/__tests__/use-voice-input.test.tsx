/**
 * Stackra file contract:
 * Purpose: proves `useVoiceInput()`: a press asks for the microphone and listens once it is granted, passing the input
 *          level through; a second press stops, hands the recording to `onRecord` and goes back to idle (or to error
 *          when the app's handler fails); a refused microphone is `denied` and any other failure is `error`; a press
 *          or `cancel` while asking drops the request and a late grant is cancelled; presses while processing are
 *          ignored; the recorder is cancelled on unmount; each state is reported once.
 * Boundary: the hook through `renderHook` in jsdom, over a recorder stand-in whose start and stop the test settles.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";

import type { VoiceRecorderPort } from "#contracts/ports/voice-recorder.port";
import type { VoiceRecording } from "#contracts/types/voice-recording.type";
import { useVoiceInput } from "#react/hooks/use-voice-input";

const RECORDING: VoiceRecording = { data: null, mimeType: "audio/webm", durationMs: 1200 };

/** A recorder whose start and stop the test settles by hand. */
function manualRecorder() {
  let started: { resolve: () => void; reject: (error: unknown) => void } | undefined;
  let stopped: { resolve: (recording: VoiceRecording) => void } | undefined;
  let level: ((value: number) => void) | undefined;
  const recorder: VoiceRecorderPort = {
    state: "idle",
    start: vi.fn(
      (onLevel: (value: number) => void) =>
        new Promise<void>((resolve, reject) => {
          level = onLevel;
          started = { resolve, reject };
        }),
    ),
    stop: vi.fn(
      () =>
        new Promise<VoiceRecording>((resolve) => {
          stopped = { resolve };
        }),
    ),
    cancel: vi.fn(),
  };
  return {
    recorder,
    grant: () => act(async () => started?.resolve()),
    refuse: (error: unknown) => act(async () => started?.reject(error)),
    finish: () => act(async () => stopped?.resolve(RECORDING)),
    level: (value: number) => act(() => level?.(value)),
  };
}

/** A DOMException-like error with a name. */
const named = (name: string) => Object.assign(new Error(name), { name });

describe("useVoiceInput (web)", () => {
  it("asks, listens with the level, then stops and hands over the recording", async () => {
    const mic = manualRecorder();
    const onRecord = vi.fn();
    const onStateChange = vi.fn();
    const { result } = renderHook(() => useVoiceInput(mic.recorder, onRecord, onStateChange));
    expect(result.current.state).toBe("idle");
    act(() => result.current.press());
    expect(result.current.state).toBe("requesting");
    await mic.grant();
    expect(result.current.state).toBe("listening");
    mic.level(0.6);
    expect(result.current.level).toBe(0.6);
    act(() => result.current.press());
    expect(result.current.state).toBe("processing");
    expect(result.current.level).toBe(0);
    // A press while processing is ignored.
    act(() => result.current.press());
    expect(mic.recorder.start).toHaveBeenCalledTimes(1);
    await mic.finish();
    expect(onRecord).toHaveBeenCalledWith(RECORDING);
    expect(result.current.state).toBe("idle");
    expect(onStateChange.mock.calls.map(([state]) => state)).toEqual([
      "requesting",
      "listening",
      "processing",
      "idle",
    ]);
  });

  it("goes to error when the app's handler for the recording fails", async () => {
    const mic = manualRecorder();
    const { result } = renderHook(() =>
      useVoiceInput(mic.recorder, () => Promise.reject(new Error("upload failed"))),
    );
    act(() => result.current.press());
    await mic.grant();
    act(() => result.current.press());
    await mic.finish();
    expect(result.current.state).toBe("error");
  });

  it("is denied when the microphone is refused and errors on any other failure", async () => {
    for (const [error, expected] of [
      [named("NotAllowedError"), "denied"],
      [named("SecurityError"), "denied"],
      [named("NotFoundError"), "error"],
      ["no device", "error"],
    ] as const) {
      const mic = manualRecorder();
      const { result } = renderHook(() => useVoiceInput(mic.recorder));
      act(() => result.current.press());
      await mic.refuse(error);
      expect(result.current.state).toBe(expected);
      // Another press asks again.
      act(() => result.current.press());
      expect(result.current.state).toBe("requesting");
    }
  });

  it("drops a request on a second press and cancels a grant that comes late", async () => {
    const mic = manualRecorder();
    const { result } = renderHook(() => useVoiceInput(mic.recorder));
    act(() => result.current.press());
    act(() => result.current.press());
    expect(result.current.state).toBe("idle");
    expect(result.current.isCancelled).toBe(true);
    expect(mic.recorder.cancel).toHaveBeenCalledTimes(1);
    await mic.grant();
    expect(result.current.state).toBe("idle");
    expect(mic.recorder.cancel).toHaveBeenCalledTimes(2);
  });

  it("cancels while listening, ignores cancel when idle, and clears the flag on the next start", async () => {
    const mic = manualRecorder();
    const { result } = renderHook(() => useVoiceInput(mic.recorder));
    act(() => result.current.cancel());
    expect(mic.recorder.cancel).not.toHaveBeenCalled();
    act(() => result.current.press());
    await mic.grant();
    act(() => result.current.cancel());
    expect(result.current.state).toBe("idle");
    expect(result.current.isCancelled).toBe(true);
    act(() => result.current.press());
    expect(result.current.isCancelled).toBe(false);
  });

  it("cancels the recorder when unmounted", () => {
    const mic = manualRecorder();
    const { unmount } = renderHook(() => useVoiceInput(mic.recorder));
    unmount();
    expect(mic.recorder.cancel).toHaveBeenCalledTimes(1);
  });
});
