/**
 * Stackra file contract:
 * Purpose: the web `VoiceInput`: a microphone button that records through a `VoiceRecorderPort` (the MediaRecorder
 *          driver unless one is passed), five level bars while listening, and a status line: idle, waiting for the
 *          microphone, listening, processing, denied or failed. Press to start and to stop; Escape cancels.
 * Boundary: the behaviour is `useVoiceInput`; this draws it. The button is a toggle (`aria-pressed` while listening)
 *           named for what a press does; the status line is a polite status region, so each state is announced. The
 *           bars are decorative (`aria-hidden`); under reduced motion they give way to the level as a still number.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1, 2.3.3, 4.1.2, 4.1.3; STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import { Mic, Square } from "@stackra/icons/react/lucide-icons";
import { useReducedMotion } from "motion/react";
import { useMemo, type KeyboardEvent, type ReactElement } from "react";
import { VisuallyHidden } from "react-aria-components";

import { AI_ASSIST_KEYS } from "#core/constants/ai-assist-keys.constant";
import { VOICE_INPUT_STATUS_KEYS } from "#core/constants/voice-input-status-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { useVoiceInput } from "#react/hooks/use-voice-input";
import { IconButton } from "#react/icon-button/icon-button";
import { Text } from "#react/text/text";
import { createWebVoiceRecorder } from "#react/voice-input/create-web-voice-recorder";
import type { VoiceInputProps } from "#react/voice-input/voice-input.props";

const K = AI_ASSIST_KEYS.ui.voice_input;

/** The level bars and each one's share of the level, loudest in the middle. */
const BARS = [
  { id: "outer-start", weight: 0.55 },
  { id: "inner-start", weight: 0.8 },
  { id: "middle", weight: 1 },
  { id: "inner-end", weight: 0.8 },
  { id: "outer-end", weight: 0.55 },
] as const;

/** A microphone button with a live level and a status line. */
export function VoiceInput({
  recorder,
  onRecord,
  onStateChange,
  label,
  isStatusVisible = true,
  isDisabled = false,
  size = "md",
  className,
}: VoiceInputProps): ReactElement {
  const t = useUiText();
  const driver = useMemo(() => recorder ?? createWebVoiceRecorder(), [recorder]);
  const { state, level, isCancelled, press, cancel } = useVoiceInput(
    driver,
    onRecord,
    onStateChange,
  );
  const isReduced = useReducedMotion() ?? false;
  const isListening = state === "listening";
  const isWorking = isListening || state === "requesting";
  const isTrouble = state === "denied" || state === "error";

  const status =
    state === "idle" && isCancelled ? t(K.cancelled) : t(VOICE_INPUT_STATUS_KEYS[state]);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !isWorking) return;
    event.preventDefault();
    cancel();
  };

  const line = (
    <Text type="small" tone={isTrouble ? "danger" : "muted"} className="min-w-0">
      {status}
      {isWorking ? <span className="ms-1 text-muted">· {t(K.cancel_hint)}</span> : null}
    </Text>
  );

  return (
    <div
      data-slot="voice-input"
      data-state={state}
      className={["flex items-center gap-3", className].filter(Boolean).join(" ")}
    >
      <IconButton
        icon={isListening ? <Square /> : <Mic />}
        label={isListening ? t(K.stop) : (label ?? t(K.start))}
        variant={isListening ? "danger" : "secondary"}
        size={size}
        isDisabled={isDisabled}
        isLoading={state === "processing"}
        aria-pressed={isListening}
        onKeyDown={onKeyDown}
        onPress={press}
      />
      {isListening ? (
        isReduced ? (
          <span aria-hidden className="text-sm text-muted tabular-nums">
            {Math.round(level * 100)}%
          </span>
        ) : (
          <span aria-hidden data-slot="voice-level" className="flex h-6 items-center gap-0.5">
            {BARS.map((bar) => (
              <span
                key={bar.id}
                className="w-1 bg-accent transition-[height] duration-(--duration-instant)"
                style={{ height: `${Math.max(15, Math.round(level * bar.weight * 100))}%` }}
              />
            ))}
          </span>
        )
      ) : null}
      <div role="status" className="min-w-0">
        {isStatusVisible ? line : <VisuallyHidden>{status}</VisuallyHidden>}
      </div>
    </div>
  );
}
