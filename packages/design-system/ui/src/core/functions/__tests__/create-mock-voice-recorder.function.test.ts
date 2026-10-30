/**
 * Stackra file contract:
 * Purpose: proves the mock voice recorder reports levels between 0 and 1 while recording, stops them on stop and
 *          cancel, hands back an audio-less recording with its length, and refuses like a browser when told to.
 * Boundary: fake timers.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D).
 */
import { createMockVoiceRecorder } from "#core/functions/create-mock-voice-recorder.function";

describe("createMockVoiceRecorder", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports levels while recording and a recording on stop", async () => {
    const recorder = createMockVoiceRecorder();
    const levels: number[] = [];
    await recorder.start((level) => levels.push(level));
    expect(recorder.state).toBe("recording");
    vi.advanceTimersByTime(800);
    expect(levels).toHaveLength(10);
    expect(levels.every((level) => level >= 0 && level <= 1)).toBe(true);
    const recording = await recorder.stop();
    expect(recording).toEqual({ data: null, mimeType: "audio/mock", durationMs: 800 });
    expect(recorder.state).toBe("idle");
    vi.advanceTimersByTime(800);
    expect(levels).toHaveLength(10);
  });

  it("stops the levels on cancel", async () => {
    const recorder = createMockVoiceRecorder();
    const onLevel = vi.fn();
    await recorder.start(onLevel);
    recorder.cancel();
    vi.advanceTimersByTime(800);
    expect(onLevel).not.toHaveBeenCalled();
    expect(recorder.state).toBe("idle");
  });

  it("refuses the microphone on request", async () => {
    await expect(createMockVoiceRecorder({ deny: true }).start(() => {})).rejects.toMatchObject({
      name: "NotAllowedError",
    });
  });
});
