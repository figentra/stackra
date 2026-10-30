/**
 * Stackra file contract:
 * Purpose: `useVoiceInput`, the VoiceInput's behaviour shared by web and native: drives a `VoiceRecorderPort` through
 *          `nextVoiceInputState` and hands back the state, the input level, whether the last take was cancelled, and
 *          `press` (start, or stop while listening, or cancel while asking) and `cancel`.
 * Boundary: no drawing. A start answered after a cancel is dropped (the driver is cancelled again); the recorder is
 *           cancelled on unmount. A refusal named `NotAllowedError` or `SecurityError` is `denied`, any other an error.
 * Runtime: isomorphic
 * Governing contract: ADR 0004 §1 (`native/` may import `#react/hooks/*`); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import { useEffect, useRef, useState } from "react";

import type { VoiceInputState } from "#contracts/enums/voice-input-state.enum";
import type { VoiceRecorderPort } from "#contracts/ports/voice-recorder.port";
import type { VoiceInputEvent } from "#contracts/types/voice-input-event.type";
import type { VoiceRecording } from "#contracts/types/voice-recording.type";
import { nextVoiceInputState } from "#core/functions/next-voice-input-state.function";

/** True when `error` is the microphone being refused. */
const isRefusal = (error: unknown) =>
  error instanceof Error && (error.name === "NotAllowedError" || error.name === "SecurityError");

/** Drives a voice recorder for a VoiceInput. */
export function useVoiceInput(
  recorder: VoiceRecorderPort,
  onRecord?: (recording: VoiceRecording) => void | Promise<void>,
  onStateChange?: (state: VoiceInputState) => void,
): {
  readonly state: VoiceInputState;
  readonly level: number;
  readonly isCancelled: boolean;
  readonly press: () => void;
  readonly cancel: () => void;
} {
  const [state, setState] = useState<VoiceInputState>("idle");
  const [level, setLevel] = useState(0);
  const [isCancelled, setCancelled] = useState(false);
  const current = useRef<VoiceInputState>("idle");

  useEffect(() => () => recorder.cancel(), [recorder]);

  const send = (event: VoiceInputEvent) => {
    const next = nextVoiceInputState(current.current, event);
    if (next === current.current) return;
    current.current = next;
    setState(next);
    if (next !== "listening") setLevel(0);
    onStateChange?.(next);
  };

  const cancel = () => {
    if (current.current !== "requesting" && current.current !== "listening") return;
    recorder.cancel();
    send("cancel");
    setCancelled(true);
  };

  const start = () => {
    setCancelled(false);
    send("start");
    recorder
      .start((next) => setLevel(next))
      .then(
        () => {
          if (current.current === "requesting") send("granted");
          else recorder.cancel();
        },
        (error: unknown) => send(isRefusal(error) ? "denied" : "failed"),
      );
  };

  const stop = () => {
    send("stop");
    recorder
      .stop()
      .then((recording) => onRecord?.(recording))
      .then(
        () => send("processed"),
        () => send("failed"),
      );
  };

  const press = () => {
    if (current.current === "listening") stop();
    else if (current.current === "requesting") cancel();
    else if (current.current !== "processing") start();
  };

  return { state, level, isCancelled, press, cancel };
}
