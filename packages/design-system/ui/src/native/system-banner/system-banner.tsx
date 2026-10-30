/**
 * Stackra file contract:
 * Purpose: the native `SystemBanner`: an app-wide message on the `Alert` (default the accent tone) with an optional
 *          dismiss button at its inline end; it slides down from the top as it mounts and slides up and fades on
 *          dismiss, then calls `onDismiss`. The system's reduce-motion setting removes the movement.
 * Boundary: generalises `EnvironmentBanner` (which stays persistent); the caller places it under the header and
 *           remembers a dismiss. The CloseButton plays its own press haptic. The dismiss label defaults to `ui`.
 * Runtime: react-native
 * Governing contract: gap inventory row 27 (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0312.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { View } from "react-native";
import Animated, { FadeInDown, FadeOutUp, ReduceMotion } from "react-native-reanimated";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { Alert } from "#native/alert/alert";
import { CloseButton } from "#native/close-button/close-button";
import { useUiText } from "#react/hooks/use-ui-text";
import type { SystemBannerProps } from "#native/system-banner/system-banner.props";

const ENTER = motionTiming(STACKRA_THEME, "reveal");
const EXIT = motionTiming(STACKRA_THEME, "base");

/** How far the banner drops in from, in points. */
const DROP = 12;

const ENTERING = FadeInDown.duration(ENTER.durationMs)
  .withInitialValues({ opacity: 0, transform: [{ translateY: -DROP }] })
  .reduceMotion(ReduceMotion.System);
const EXITING = FadeOutUp.duration(EXIT.durationMs).reduceMotion(ReduceMotion.System);

/** An app-wide message that slides in from the top and away when dismissed. */
export function SystemBanner({
  tone = "accent",
  isDismissible = true,
  onDismiss,
  dismissLabel,
  className,
  ...rest
}: SystemBannerProps): ReactElement | null {
  const t = useUiText();
  const [isOpen, setOpen] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const dismiss = () => {
    setOpen(false);
    // The exit plays on the UI thread; the caller hears of the dismiss once it is over.
    if (onDismiss) timer.current = setTimeout(onDismiss, EXIT.durationMs);
  };

  if (!isOpen) return null;
  return (
    <Animated.View entering={ENTERING} exiting={EXITING} style={{ position: "relative" }}>
      <Alert
        {...rest}
        tone={tone}
        className={[isDismissible ? "pe-12" : "", className].filter(Boolean).join(" ")}
      />
      {isDismissible ? (
        <View style={{ position: "absolute", top: 8, end: 8 }}>
          <CloseButton
            label={dismissLabel ?? t(UI_KEYS.ui.system_banner.dismiss)}
            onPress={dismiss}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}
