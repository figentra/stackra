/**
 * Stackra file contract:
 * Purpose: `createWebVoiceRecorder`, the web `VoiceRecorderPort` driver: asks for the microphone with getUserMedia,
 *          records it with MediaRecorder and reports the input level once a frame from an AnalyserNode (the RMS of the
 *          waveform, scaled so speech fills the range). `stop` hands back the audio as a Blob.
 * Boundary: browser APIs only, no dependency. Stopping or cancelling releases the microphone (every track stopped)
 *           and closes the audio context. A refusal rejects `start` with the browser's `NotAllowedError`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { VoiceRecorderPort } from "#contracts/ports/voice-recorder.port";
import type { VoiceRecording } from "#contracts/types/voice-recording.type";

/** Speech rarely passes an RMS of a third of full scale; this gain spreads it over 0 to 1. */
const GAIN = 3;

/** A recorder over the browser's microphone. */
export function createWebVoiceRecorder(): VoiceRecorderPort {
  let stream: MediaStream | undefined;
  let recorder: MediaRecorder | undefined;
  let context: AudioContext | undefined;
  let frame = 0;
  let chunks: Blob[] = [];
  let startedAt = 0;
  let state: VoiceRecorderPort["state"] = "idle";

  const release = () => {
    cancelAnimationFrame(frame);
    for (const track of stream?.getTracks() ?? []) track.stop();
    void context?.close().catch(() => undefined);
    stream = undefined;
    context = undefined;
    recorder = undefined;
    state = "idle";
  };

  return {
    get state() {
      return state;
    },
    async start(onLevel) {
      release();
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      context.createMediaStreamSource(stream).connect(analyser);
      const wave = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(wave);
        let sum = 0;
        for (const sample of wave) sum += ((sample - 128) / 128) ** 2;
        onLevel(Math.min(1, Math.sqrt(sum / wave.length) * GAIN));
        frame = requestAnimationFrame(tick);
      };
      chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.addEventListener("dataavailable", (event) => chunks.push(event.data));
      recorder.start();
      startedAt = Date.now();
      state = "recording";
      tick();
    },
    stop() {
      const current = recorder;
      if (!current || current.state === "inactive") {
        release();
        return Promise.resolve({ data: null, mimeType: "", durationMs: 0 });
      }
      return new Promise<VoiceRecording>((resolve) => {
        current.addEventListener(
          "stop",
          () => {
            const mimeType = current.mimeType;
            resolve({
              data: new Blob(chunks, mimeType ? { type: mimeType } : {}),
              mimeType,
              durationMs: Date.now() - startedAt,
            });
          },
          { once: true },
        );
        current.stop();
        release();
      });
    },
    cancel() {
      if (recorder && recorder.state !== "inactive") recorder.stop();
      chunks = [];
      release();
    },
  };
}
