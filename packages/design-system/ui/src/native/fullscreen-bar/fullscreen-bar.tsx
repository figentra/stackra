/**
 * Stackra file contract:
 * Purpose: the native `FullscreenBar`: the title, actions and exit of a full-screen mode, pinned under the status
 *          bar. It slides up after `autoHideMs` without a touch on it; a tap at the top edge brings it back, or, when
 *          `isLocked`, only a long press there (the manager gesture). Exiting plays an impact haptic.
 * Boundary: the slide is Reanimated on the theme's base duration and jumps under the system's reduce-motion
 *           setting. With a screen reader on, the bar never hides, since its user cannot see it come back. A hidden
 *           bar is hidden from assistive technology; the top edge is then a named button that reveals it.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decisions 3 and 5: adapted form); GAPS.md row 32 (owner decision 2026-10-28); WCAG
 *          2.2 SC 2.2.1.
 */
import { IconRegistryProvider } from "@stackra/icons/native";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactElement } from "react";

import { FULLSCREEN_BAR_KEYS } from "#core/constants/fullscreen-bar-keys.constant";
import { FULLSCREEN_BAR_LONG_PRESS_MS } from "#core/constants/fullscreen-bar-long-press-ms.constant";
import { useAutoHide } from "#react/hooks/use-auto-hide";
import { useUiText } from "#react/hooks/use-ui-text";
import { FULLSCREEN_BAR_ICONS } from "#native/fullscreen-bar/fullscreen-bar-icons.constant";
import { withHaptic } from "#native/haptics/with-haptic.function";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { Text } from "#native/text/text";
import type { FullscreenBarProps } from "#native/fullscreen-bar/fullscreen-bar.props";

/** The bar's words. */
const K = FULLSCREEN_BAR_KEYS.ui.fullscreen_bar;

/** The slide's duration. */
const SLIDE = motionTiming(STACKRA_THEME, "base");

/** The height of the touch strip at the top edge that brings the bar back, below the status bar, in points. */
const EDGE = 24;

/** The exit and title bar of a full-screen mode, hiding itself after a quiet spell. */
export function FullscreenBar({
  title,
  actions,
  onExit,
  exitLabel,
  autoHideMs = 4000,
  isLocked = false,
  style,
  ...rest
}: FullscreenBarProps): ReactElement {
  const t = useUiText();
  const insets = useSafeAreaInsets();
  const isReduced = useReducedMotion();
  const [isReaderOn, setReaderOn] = useState(false);
  const { isVisible, show, hold } = useAutoHide(isReaderOn ? false : autoHideMs);
  const [height, setHeight] = useState(0);
  const shown = useSharedValue(1);

  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then(setReaderOn);
    const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setReaderOn);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const to = isVisible ? 1 : 0;
    shown.set(isReduced ? to : withTiming(to, { duration: SLIDE.durationMs }));
  }, [isVisible, isReduced, shown]);

  const slide = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [{ translateY: (shown.get() - 1) * height }],
  }));

  return (
    <>
      {isVisible ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(isLocked ? K.reveal_locked : K.reveal)}
          {...(isLocked ? {} : { onPress: show })}
          onLongPress={show}
          delayLongPress={FULLSCREEN_BAR_LONG_PRESS_MS}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: insets.top + EDGE,
            zIndex: 50,
          }}
        />
      )}
      <Animated.View
        {...rest}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        onTouchStart={() => hold(true)}
        onTouchEnd={() => hold(false)}
        accessibilityElementsHidden={!isVisible}
        importantForAccessibility={isVisible ? "auto" : "no-hide-descendants"}
        pointerEvents={isVisible ? "auto" : "none"}
        className="absolute inset-x-0 top-0 z-50 flex-row items-center gap-3 border-b border-separator bg-surface px-4 pb-2"
        style={[{ paddingTop: insets.top + 8 }, slide, style]}
      >
        <Text className="flex-1 font-medium" numberOfLines={1}>
          {title}
        </Text>
        {actions}
        <IconButton
          variant="ghost"
          label={exitLabel ?? t(K.exit)}
          onPress={withHaptic("impact", onExit)}
          icon={
            <IconRegistryProvider registry={FULLSCREEN_BAR_ICONS}>
              <Icon name="minimize-2" />
            </IconRegistryProvider>
          }
        />
      </Animated.View>
    </>
  );
}
