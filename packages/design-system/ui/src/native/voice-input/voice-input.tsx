/**
 * Stackra file contract:
 * Purpose: the native `VoiceInput`: a microphone button that records through a `VoiceRecorderPort` (the mock driver
 *          unless one is passed: no native audio driver is chosen yet), five level bars while listening, and a status
 *          line: idle, waiting for the microphone, listening, processing, denied or failed. Press to start and to stop.
 * Boundary: the behaviour is `useVoiceInput`; this draws it. The button reports `checked` while listening and is named
 *           for what a press does; each state change is announced (`announceForAccessibility`, and a polite live
 *           region on Android). The bars are hidden from assistive technology and change height without animating;
 *           under reduced motion they give way to the level as a still number.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3, 4.1.2, 4.1.3; STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import { Mic, Square } from "@stackra/icons/native/lucide-icons";
import { useEffect, useMemo, type ReactElement } from "react";
import { AccessibilityInfo, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { AI_ASSIST_KEYS } from "#core/constants/ai-assist-keys.constant";
import { VOICE_INPUT_STATUS_KEYS } from "#core/constants/voice-input-status-keys.constant";
import { createMockVoiceRecorder } from "#core/functions/create-mock-voice-recorder.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useVoiceInput } from "#react/hooks/use-voice-input";
import { IconButton } from "#native/icon-button/icon-button";
import { Text } from "#native/text/text";
import type { VoiceInputProps } from "#native/voice-input/voice-input.props";

const K = AI_ASSIST_KEYS.ui.voice_input;

/** The level bars and each one's share of the level, loudest in the middle. */
const BARS = [
  { id: "outer-start", weight: 0.55 },
  { id: "inner-start", weight: 0.8 },
  { id: "middle", weight: 1 },
  { id: "inner-end", weight: 0.8 },
  { id: "outer-end", weight: 0.55 },
] as const;

/** The bars' full height in points. */
const BAR_HEIGHT = 24;

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
  const driver = useMemo(() => recorder ?? createMockVoiceRecorder(), [recorder]);
  const { state, level, isCancelled, press } = useVoiceInput(driver, onRecord, onStateChange);
  const isReduced = useReducedMotion();
  const isListening = state === "listening";
  const isTrouble = state === "denied" || state === "error";
  const status =
    state === "idle" && isCancelled ? t(K.cancelled) : t(VOICE_INPUT_STATUS_KEYS[state]);

  // Every change but the first idle is said; a screen reader on iOS has no live region.
  useEffect(() => {
    if (state !== "idle" || isCancelled) AccessibilityInfo.announceForAccessibility(status);
  }, [state, isCancelled, status]);

  return (
    <View className={["flex-row items-center gap-3", className].filter(Boolean).join(" ")}>
      <IconButton
        icon={isListening ? <Square /> : <Mic />}
        label={isListening ? t(K.stop) : (label ?? t(K.start))}
        variant={isListening ? "danger" : "secondary"}
        size={size}
        isDisabled={isDisabled}
        isLoading={state === "processing"}
        accessibilityState={{ checked: isListening }}
        onPress={press}
      />
      {isListening ? (
        isReduced ? (
          <Text type="small" tone="muted" importantForAccessibility="no-hide-descendants">
            {`${Math.round(level * 100)}%`}
          </Text>
        ) : (
          <View
            className="flex-row items-center gap-0.5"
            style={{ height: BAR_HEIGHT }}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            {BARS.map((bar) => (
              <View
                key={bar.id}
                className="w-1 bg-accent"
                style={{ height: Math.max(4, Math.round(level * bar.weight * BAR_HEIGHT)) }}
              />
            ))}
          </View>
        )
      ) : null}
      {isStatusVisible ? (
        <Text
          type="small"
          tone={isTrouble ? "danger" : "muted"}
          className="min-w-0 flex-1"
          accessibilityLiveRegion="polite"
        >
          {status}
        </Text>
      ) : null}
    </View>
  );
}
