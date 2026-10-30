/**
 * Stackra file contract:
 * Purpose: the native `PressFeedback`: HeroUI Native's PressableFeedback around any content, answering a press with
 *          its built-in shrink (`scale`), its highlight wash (`highlight`) or its ripple from the touch (`ripple`), and
 *          the light haptic; a button to VoiceOver and TalkBack.
 * Boundary: a thin wrapper: every other PressableFeedback prop passes through, and HeroUI's animations follow the
 *           system's reduced-motion setting. Disabled drops the feedback and the press.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); owner decision 6 of STA-350 (thin
 *          wrappers); wave 3c mobile interactions (owner approval 2026-10-28).
 */
import { PressableFeedback } from "heroui-native";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { withHaptic } from "#native/haptics/with-haptic.function";
import type { PressFeedbackProps } from "#native/press-feedback/press-feedback.props";

/** A pressable surface around any content, with a visible and felt answer to the press. */
export function PressFeedback({
  children,
  onPress,
  label,
  feedback = "scale",
  isDisabled = false,
  ...rest
}: PressFeedbackProps): ReactElement {
  return (
    <PressableFeedback
      {...rest}
      isDisabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      animation={isDisabled ? "disable-all" : feedback === "scale"}
      {...omitUndefined({ accessibilityLabel: label, onPress: withHaptic("light", onPress) })}
    >
      {feedback === "highlight" ? <PressableFeedback.Highlight /> : null}
      {feedback === "ripple" ? <PressableFeedback.Ripple /> : null}
      {children}
    </PressableFeedback>
  );
}
