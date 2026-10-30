/**
 * Stackra file contract:
 * Purpose: the native `SaveBar`, the contextual save bar of a dirty form: a named toolbar on the house Card with the
 *          message, any extra content (usually a `SaveStatus`), Discard and Save. It slides up from the bottom when
 *          `isDirty` turns true and down when it turns false, and a new `attentionKey` shakes it and plays a warning
 *          haptic, on react-native-reanimated with the theme's `base` step. The message is announced as the bar appears.
 * Boundary: no styling of its own beyond the row layout; the app places it at the foot of the screen (above the tab
 *           bar or in a footer). Save is busy while `isSaving` or while the promise `onSave` returned is pending; a
 *           rejection is the app's to report. The system's reduce-motion setting shows and hides the bar at once and
 *           skips the shake; the haptic still plays, since it is the non-visual cue. Strings are wrapped in `Text`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0329 (motion layer); ADR 0139 (action UX);
 *          WCAG 2.2 SC 2.3.3, 4.1.2, 4.1.3; design-system gap inventory row 8.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import Animated, {
  ReduceMotion,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import { SAVE_BAR_KEYS } from "#core/constants/save-bar-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { Card } from "#native/card/card";
import { haptics } from "#native/haptics/haptics";
import { Text } from "#native/text/text";
import type { SaveBarProps } from "#native/save-bar/save-bar.props";

const BASE = motionTiming(STACKRA_THEME, "base");
const ENTER = SlideInDown.duration(BASE.durationMs).reduceMotion(ReduceMotion.System);
const EXIT = SlideOutDown.duration(BASE.durationMs).reduceMotion(ReduceMotion.System);

/** The shake that calls the eye to the bar, in points along the inline axis, each step this long. */
const SHAKE = [-8, 8, -6, 6, 0];
const SHAKE_STEP_MS = 50;

/** The bar that asks to save or discard a dirty form. */
export function SaveBar({
  isDirty,
  onSave,
  onDiscard,
  isSaving = false,
  isSaveDisabled,
  attentionKey,
  message: messageProp,
  saveLabel,
  discardLabel,
  label,
  children,
  ...rest
}: SaveBarProps): ReactElement | null {
  const t = useUiText();
  const keys = SAVE_BAR_KEYS.ui.save_bar;
  const message = messageProp ?? t(keys.message);
  const isReduced = useReducedMotion();
  const [isRunning, setIsRunning] = useState(false);
  const offset = useSharedValue(0);
  const seen = useRef(attentionKey);
  const shake = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));

  // A new attention key is felt and, when motion is welcome, seen.
  useEffect(() => {
    if (attentionKey === seen.current) return;
    seen.current = attentionKey;
    if (!isDirty) return;
    haptics.play("warning");
    if (!isReduced)
      offset.set(withSequence(...SHAKE.map((to) => withTiming(to, { duration: SHAKE_STEP_MS }))));
  }, [attentionKey, isDirty, isReduced, offset]);

  useEffect(() => {
    if (isDirty) AccessibilityInfo.announceForAccessibility(message);
  }, [isDirty, message]);

  if (!isDirty) return null;

  const save = () => {
    const result = onSave();
    if (!(result instanceof Promise)) return;
    setIsRunning(true);
    const settle = () => setIsRunning(false);
    void result.then(settle, settle);
  };

  return (
    <Animated.View {...rest} entering={ENTER} exiting={EXIT}>
      <Animated.View style={shake}>
        <Card
          role="toolbar"
          accessibilityLabel={label ?? t(keys.label)}
          className="flex-row flex-wrap items-center gap-3 p-3"
        >
          <Text type="small" className="flex-1 font-medium">
            {message}
          </Text>
          {children}
          <Button size="sm" variant="ghost" onPress={onDiscard}>
            {discardLabel ?? t(keys.discard)}
          </Button>
          <Button
            size="sm"
            isLoading={isSaving || isRunning}
            isDisabled={isSaveDisabled === true}
            onPress={save}
          >
            {saveLabel ?? t(keys.save)}
          </Button>
        </Card>
      </Animated.View>
    </Animated.View>
  );
}
