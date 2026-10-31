/**
 * Stackra file contract:
 * Purpose: `createMockVoiceRecorder`, a `VoiceRecorderPort` driver that records nothing: `start` resolves at once and
 *          reports a made-up speaking level every 80 ms, `stop` hands back a recording with no audio and its length.
 *          The native VoiceInput's default until a native audio driver is chosen, and a stand-in for demos and tests.
 * Boundary: timers only; no microphone, no dependency. `deny: true` refuses `start` as a browser refusing the
 *           microphone does (`NotAllowedError`).
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { VoiceRecorderPort } from "#contracts/ports/voice-recorder.port";
import type { VoiceRecording } from "#contracts/types/voice-recording.type";

/** How often the made-up level changes, in milliseconds. */
// oxlint-disable-next-line stackra/no-literal-duration -- a mock level sampling interval, not motion
const TICK_MS = 80;

/** A recorder that makes up its level and keeps no audio. */
export function createMockVoiceRecorder(
  options: { readonly deny?: boolean } = {},
): VoiceRecorderPort {
  let timer: ReturnType<typeof setInterval> | undefined;
  let startedAt = 0;
  let state: VoiceRecorderPort["state"] = "idle";
  const end = () => {
    clearInterval(timer);
    timer = undefined;
    state = "idle";
  };
  return {
    get state() {
      return state;
    },
    start(onLevel) {
      if (options.deny) {
        return Promise.reject(
          Object.assign(new Error("Microphone refused"), { name: "NotAllowedError" }),
        );
      }
      end();
      state = "recording";
      startedAt = Date.now();
      let step = 0;
      // Two slow waves read as speech with pauses; deterministic, so tests and screenshots are stable.
      timer = setInterval(() => {
        step += 1;
        onLevel(0.15 + 0.85 * Math.abs(Math.sin(step / 3) * Math.sin(step / 11)));
      }, TICK_MS);
      return Promise.resolve();
    },
    stop() {
      const recording: VoiceRecording = {
        data: null,
        mimeType: "audio/mock",
        durationMs: state === "recording" ? Date.now() - startedAt : 0,
      };
      end();
      return Promise.resolve(recording);
    },
    cancel: end,
  };
}
