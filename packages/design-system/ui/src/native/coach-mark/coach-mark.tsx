/**
 * Stackra file contract:
 * Purpose: the native `CoachMark`: an onboarding tour in a transparent modal that dims the screen around each step's
 *          target (four backdrop panes leave a cutout), pulses a beacon on it, and shows a callout above or below it
 *          with the step's title and text, "Step n of m", Back, Next or Done, and Skip. The cutout glides from
 *          target to target.
 * Boundary: targets are measured with `measureInWindow`. The glide and the pulse are Reanimated; under the system's
 *           reduce-motion setting the cutout jumps and the beacon does not pulse. The callout is the modal's one
 *           accessible view (`accessibilityViewIsModal`) with its title as a header; the Android back button skips.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decisions 3 and 5: adapted form); GAPS.md row 39 (owner decision 2026-10-28).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useState } from "react";
import { Modal, View, useWindowDimensions } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import type { CoachMarkOutcome } from "#contracts/enums/coach-mark-outcome.enum";
import { COACH_MARK_KEYS } from "#core/constants/coach-mark-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Heading } from "#native/heading/heading";
import { Surface } from "#native/surface/surface";
import { Text } from "#native/text/text";
import type { CoachMarkProps } from "#native/coach-mark/coach-mark.props";

/** The tour's words. */
const K = COACH_MARK_KEYS.ui.coach_mark;

/** The cutout's glide between targets. */
const GLIDE = motionTiming(STACKRA_THEME, "base");

/** One beacon pulse, in milliseconds. */
const PULSE_MS = 1600;

/** The room left around the target inside the cutout, and between the cutout and the callout, in points. */
const PAD = 6;

/** The height the callout needs below the target before it goes above instead, in points. */
const CALLOUT_ROOM = 220;

/** The beacon's diameter, in points. */
const BEACON = 12;

/** Each step of a tour spotlit in turn, with a callout beside it. */
export function CoachMark({
  steps,
  isOpen,
  defaultOpen,
  onOpenChange,
  onFinish,
}: CoachMarkProps): ReactElement | null {
  const t = useUiText();
  const isReduced = useReducedMotion();
  const { direction } = useDesignSystem();
  const screen = useWindowDimensions();
  const [innerOpen, setInnerOpen] = useState(defaultOpen ?? false);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | undefined>();
  const open = (isOpen ?? innerOpen) && steps.length > 0;
  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const w = useSharedValue(0);
  const h = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!open) return;
    step?.target.current?.measureInWindow((left, top, width, height) =>
      setBox({ x: left - PAD, y: top - PAD, w: width + PAD * 2, h: height + PAD * 2 }),
    );
  }, [open, step]);

  // Glide to the new cutout, or jump when the user has asked for less motion.
  useEffect(() => {
    if (box === undefined) return;
    const to = (value: number) =>
      isReduced ? value : withTiming(value, { duration: GLIDE.durationMs });
    x.set(to(box.x));
    y.set(to(box.y));
    w.set(to(box.w));
    h.set(to(box.h));
  }, [box, isReduced, x, y, w, h]);

  useEffect(() => {
    if (!open || isReduced) return;
    pulse.set(withRepeat(withTiming(1, { duration: PULSE_MS }), -1, false));
    return () => cancelAnimation(pulse);
  }, [open, isReduced, pulse]);

  const above = useAnimatedStyle(() => ({ top: 0, left: 0, right: 0, height: y.get() }));
  const below = useAnimatedStyle(() => ({ top: y.get() + h.get(), left: 0, right: 0, bottom: 0 }));
  const before = useAnimatedStyle(() => ({
    top: y.get(),
    height: h.get(),
    left: 0,
    width: x.get(),
  }));
  const after = useAnimatedStyle(() => ({
    top: y.get(),
    height: h.get(),
    left: x.get() + w.get(),
    right: 0,
  }));
  // The beacon sits on the target's inline-end top corner; window coordinates are physical, so RTL takes the left.
  const beacon = useAnimatedStyle(() => ({
    top: y.get() - BEACON / 2,
    left: (direction === "rtl" ? x.get() : x.get() + w.get()) - BEACON / 2,
  }));
  const ring = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - pulse.get()),
    transform: [{ scale: 1 + 1.4 * pulse.get() }],
  }));

  const finish = (outcome: CoachMarkOutcome) => {
    if (isOpen === undefined) setInnerOpen(false);
    onOpenChange?.(false);
    onFinish?.(outcome);
    setIndex(0);
    setBox(undefined);
  };

  if (!open || step === undefined) return null;
  const isBelow = box === undefined || box.y + box.h + CALLOUT_ROOM < screen.height;
  return (
    <Modal
      transparent
      visible
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => finish("skipped")}
    >
      {(
        [
          ["above", above],
          ["below", below],
          ["before", before],
          ["after", after],
        ] as const
      ).map(([place, pane]) => (
        <Animated.View
          key={place}
          pointerEvents="none"
          className="absolute bg-backdrop"
          style={pane}
        />
      ))}
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[{ position: "absolute", width: BEACON, height: BEACON }, beacon]}
      >
        {isReduced ? null : (
          <Animated.View
            className="absolute inset-0 bg-accent"
            style={[{ borderRadius: BEACON / 2 }, ring]}
          />
        )}
        <View className="absolute inset-0 bg-accent" style={{ borderRadius: BEACON / 2 }} />
      </Animated.View>
      <View
        accessibilityViewIsModal
        style={{
          position: "absolute",
          start: 16,
          end: 16,
          ...(box === undefined
            ? { top: screen.height / 3 }
            : isBelow
              ? { top: box.y + box.h + PAD * 2 }
              : { bottom: screen.height - box.y + PAD * 2 }),
        }}
      >
        <Surface variant="default" className="gap-2 p-4">
          <Heading level={2} type="h4" accessibilityRole="header">
            {step.title}
          </Heading>
          {step.description == null ? null : <Text type="small">{step.description}</Text>}
          <View className="mt-1 flex-row flex-wrap items-center gap-2">
            <Text type="caption" tone="muted" className="me-auto">
              {t(K.progress, { current: index + 1, total: steps.length })}
            </Text>
            <Button size="sm" variant="ghost" onPress={() => finish("skipped")}>
              {t(K.skip)}
            </Button>
            {index === 0 ? null : (
              <Button size="sm" variant="secondary" onPress={() => setIndex(index - 1)}>
                {t(K.back)}
              </Button>
            )}
            <Button size="sm" onPress={() => (isLast ? finish("done") : setIndex(index + 1))}>
              {isLast ? t(K.done) : t(K.next)}
            </Button>
          </View>
        </Surface>
      </View>
    </Modal>
  );
}
