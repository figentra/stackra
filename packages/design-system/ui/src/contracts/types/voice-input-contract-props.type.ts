/**
 * Stackra file contract:
 * Purpose: `VoiceInputContractProps`, the props every runtime's `VoiceInput` takes: the recorder driving it, what to
 *          do with a recording, the button's name and look.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { Size } from "#contracts/enums/size.enum";
import type { VoiceInputState } from "#contracts/enums/voice-input-state.enum";
import type { VoiceRecorderPort } from "#contracts/ports/voice-recorder.port";
import type { VoiceRecording } from "#contracts/types/voice-recording.type";

/** Props shared by the web and native `VoiceInput`. */
export interface VoiceInputContractProps {
  /** The recorder. Defaults to the MediaRecorder driver on web and the mock driver on native. */
  readonly recorder?: VoiceRecorderPort | undefined;
  /**
   * Called with each finished recording. While a returned promise runs the input shows "Processing", for example
   * while the app transcribes; a rejection shows the error state.
   */
  readonly onRecord?: ((recording: VoiceRecording) => void | Promise<void>) | undefined;
  /** Called each time the state changes. */
  readonly onStateChange?: ((state: VoiceInputState) => void) | undefined;
  /** The button's name while idle. Defaults to the catalogue's "Start recording". */
  readonly label?: string | undefined;
  /** False to hide the status line beside the button (it is still announced). Defaults to true. */
  readonly isStatusVisible?: boolean | undefined;
  /** True to show the button but refuse presses. */
  readonly isDisabled?: boolean | undefined;
  /** The button's size. Defaults to `md`. */
  readonly size?: Size | undefined;
}
