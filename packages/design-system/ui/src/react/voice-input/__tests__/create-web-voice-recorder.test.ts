/**
 * Stackra file contract:
 * Purpose: proves the web voice recorder asks for the microphone, reports the analyser's level, hands back the
 *          recorded chunks as a Blob on stop, releases the microphone and the audio context on stop and cancel, and
 *          passes a refusal through.
 * Boundary: jsdom with getUserMedia, AudioContext, MediaRecorder and requestAnimationFrame as stubs.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { createWebVoiceRecorder } from "#react/voice-input/create-web-voice-recorder";

const state = vi.hoisted(() => ({
  trackStopped: 0,
  contextClosed: 0,
  recorders: [] as FakeRecorder[],
  frames: [] as (() => void)[],
}));

/** A MediaRecorder that emits one chunk and `stop` when stopped. */
class FakeRecorder extends EventTarget {
  state: "inactive" | "recording" = "inactive";

  mimeType = "audio/webm";

  constructor() {
    super();
    state.recorders.push(this);
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.dispatchEvent(Object.assign(new Event("dataavailable"), { data: new Blob(["voice"]) }));
    this.dispatchEvent(new Event("stop"));
  }
}

/** An AudioContext whose analyser hears a half-scale square wave (RMS 0.5). */
class FakeAudioContext {
  createAnalyser() {
    return {
      fftSize: 0,
      getByteTimeDomainData: (wave: Uint8Array) =>
        wave.forEach((_, i) => (wave[i] = i % 2 ? 192 : 64)),
    };
  }

  createMediaStreamSource() {
    return { connect: () => undefined };
  }

  close() {
    state.contextClosed += 1;
    return Promise.resolve();
  }
}

const getUserMedia = vi.fn(() =>
  Promise.resolve({ getTracks: () => [{ stop: () => (state.trackStopped += 1) }] }),
);

beforeEach(() => {
  state.trackStopped = 0;
  state.contextClosed = 0;
  state.recorders = [];
  state.frames = [];
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal("requestAnimationFrame", (fn: () => void) => state.frames.push(fn));
  vi.stubGlobal("cancelAnimationFrame", () => undefined);
  Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });
});
afterEach(() => vi.unstubAllGlobals());

describe("createWebVoiceRecorder", () => {
  it("records, reports the level and hands back the audio", async () => {
    const recorder = createWebVoiceRecorder();
    const levels: number[] = [];
    await recorder.start((level) => levels.push(level));
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(recorder.state).toBe("recording");
    expect(levels[0]).toBeCloseTo(1);
    const recording = await recorder.stop();
    expect(recording.mimeType).toBe("audio/webm");
    expect(await recording.data?.text()).toBe("voice");
    expect(recorder.state).toBe("idle");
    expect(state.trackStopped).toBe(1);
    expect(state.contextClosed).toBe(1);
  });

  it("releases everything on cancel", async () => {
    const recorder = createWebVoiceRecorder();
    await recorder.start(() => undefined);
    recorder.cancel();
    expect(state.recorders[0]?.state).toBe("inactive");
    expect(state.trackStopped).toBe(1);
    expect(recorder.state).toBe("idle");
  });

  it("passes a refusal through", async () => {
    getUserMedia.mockImplementationOnce(() =>
      Promise.reject(Object.assign(new Error("no"), { name: "NotAllowedError" })),
    );
    await expect(createWebVoiceRecorder().start(() => undefined)).rejects.toMatchObject({
      name: "NotAllowedError",
    });
  });
});
