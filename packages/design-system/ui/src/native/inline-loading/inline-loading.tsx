/**
 * Stackra file contract:
 * Purpose: the native `InlineLoading`: a spinner, a check or an alert icon with its text, for a row-level save or a
 *          payment. The icon and text swap with a zoom-and-fade on react-native-reanimated (the spinner-to-check
 *          morph), with the theme's `fast` step; a change to `success` or `error` plays that haptic and every new text
 *          is announced (`AccessibilityInfo.announceForAccessibility`), standing in for the web's live region.
 * Boundary: no styling of its own beyond the row layout; the icons are the house Spinner and Icon. The system's
 *           reduce-motion setting swaps at once (`ReduceMotion.System`). Haptics go through the house `haptics` and
 *           are skipped with `playsHaptics` off. The state is the app's.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0329 (motion layer); WCAG 2.2 SC 2.3.3,
 *          4.1.3; design-system gap inventory row 28.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useRef } from "react";
import { AccessibilityInfo, View } from "react-native";
import Animated, { ReduceMotion, ZoomIn, ZoomOut } from "react-native-reanimated";
import type { ReactElement } from "react";

import { INLINE_LOADING_KEYS } from "#core/constants/inline-loading-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import { Spinner } from "#native/spinner/spinner";
import { Text } from "#native/text/text";
import type { InlineLoadingProps } from "#native/inline-loading/inline-loading.props";

const FAST = motionTiming(STACKRA_THEME, "fast");
const ENTER = ZoomIn.duration(FAST.durationMs).reduceMotion(ReduceMotion.System);
const EXIT = ZoomOut.duration(FAST.durationMs).reduceMotion(ReduceMotion.System);

/** A spinner, then a check or an alert, with its text; every change is announced. */
export function InlineLoading({
  status,
  loadingLabel,
  successLabel,
  errorLabel,
  playsHaptics = true,
  className,
  ...rest
}: InlineLoadingProps): ReactElement {
  const t = useUiText();
  const keys = INLINE_LOADING_KEYS.ui.inline_loading;
  const text =
    status === "loading"
      ? (loadingLabel ?? t(keys.loading))
      : status === "success"
        ? (successLabel ?? t(keys.success))
        : status === "error"
          ? (errorLabel ?? t(keys.error))
          : "";
  const seen = useRef(status);

  // The outcome is felt once, when the state reaches it, not on the first render.
  useEffect(() => {
    if (status === seen.current) return;
    seen.current = status;
    if (playsHaptics && (status === "success" || status === "error")) haptics.play(status);
  }, [status, playsHaptics]);

  // The text, not the state, is the dependency, so a caller's new label is announced too.
  useEffect(() => {
    if (text !== "") AccessibilityInfo.announceForAccessibility(text);
  }, [text]);

  return (
    <View {...rest} className={`flex-row items-center ${className ?? ""}`}>
      {status === "idle" ? null : (
        <Animated.View
          key={status}
          entering={ENTER}
          exiting={EXIT}
          className="flex-row items-center gap-2"
        >
          {status === "loading" ? (
            <Spinner size="sm" />
          ) : (
            <Icon
              name={status === "success" ? "circle-check" : "circle-alert"}
              size="sm"
              tone={status === "success" ? "success" : "danger"}
            />
          )}
          <Text
            type="small"
            tone={status === "error" ? "danger" : status === "success" ? "success" : "muted"}
          >
            {text}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
