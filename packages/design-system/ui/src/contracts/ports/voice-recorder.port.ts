/**
 * Stackra file contract:
 * Purpose: `VoiceRecorderPort`, how a `VoiceInput` records: start (asking for the microphone, then reporting the
 *          input level from 0 to 1 as it changes), stop (the recording), cancel (nothing kept) and the driver's state.
 *          The web driver is `createWebVoiceRecorder` (MediaRecorder); the native default is `createMockVoiceRecorder`
 *          until a native audio driver is chosen; an app passes its own through the `recorder` prop.
 * Boundary: a port only. A driver refused the microphone rejects `start` with an error named `NotAllowedError` (as the
 *           browser does); any other rejection is a failure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { VoiceRecording } from "#contracts/types/voice-recording.type";

/** Records the voice for a VoiceInput. */
export interface VoiceRecorderPort {
  /** `recording` between a resolved `start` and a `stop` or `cancel`; `idle` otherwise. */
  readonly state: "idle" | "recording";
  /** Asks for the microphone and starts recording; `onLevel` gets the input level, 0 to 1, as it changes. */
  readonly start: (onLevel: (level: number) => void) => Promise<void>;
  /** Stops recording and hands back the recording. */
  readonly stop: () => Promise<VoiceRecording>;
  /** Stops recording and drops it. Safe to call in any state. */
  readonly cancel: () => void;
}
