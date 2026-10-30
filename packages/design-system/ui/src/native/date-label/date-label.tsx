/**
 * Stackra file contract:
 * Purpose: the native `DateLabel`: a soft Chip that says "Overdue · 3 days ago", "Expires soon · tomorrow" or just the
 *          date, in the state's tone (danger past, warning soon); VoiceOver and TalkBack read it with the full date
 *          (Hijri when asked). An overdue or expired label pulses once as it appears.
 * Boundary: the rules are `dateLabelOf`'s; the look is the Chip's. The pulse is Reanimated's, one scale out and back
 *           on the base step on the UI thread, never a loop, and none under the system's reduced motion or with
 *           `isAnimated` off. No haptic: a label is not a control.
 * Runtime: react-native
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0329
 *          (motion layer); ADR 0060 (right-to-left).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useNumerals } from "@stackra/i18n/react";
import { useEffect, useState } from "react";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import { DATE_LABEL_KEYS } from "#core/constants/date-label-keys.constant";
import { dateLabelOf } from "#core/functions/date-label-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Chip } from "#native/chip/chip";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import type { DateLabelProps } from "#native/date-label/date-label.props";

const BASE = motionTiming(STACKRA_THEME, "base");

/** How far the pulse grows. */
const PULSE_SCALE = 1.08;

/** The label keeps its own width in a column. */
const SELF_START = { alignSelf: "flex-start" } as const;

/** The keys of the words. */
const K = DATE_LABEL_KEYS.ui.date_label;

/** A date as a chip, with its due or expiry state. */
export function DateLabel({
  date,
  kind = "date",
  soonDays = 3,
  isRelative = true,
  calendar = "gregory",
  now,
  size = "sm",
  isAnimated = true,
  variant = "soft",
  ...rest
}: DateLabelProps): ReactElement | null {
  const { locale } = useDesignSystem();
  const numerals = useNumerals();
  const t = useUiText();
  // "Now" is read once, when the label mounts: reading the clock on every render would make rendering impure.
  const [mountedAt] = useState(() => new Date());
  const isReduced = useReducedMotion();
  const scale = useSharedValue(1);
  const info = dateLabelOf({
    date,
    now: now ?? mountedAt,
    kind,
    soonDays,
    locale,
    numerals,
    calendar,
    isRelative,
  });
  const pulses = isAnimated && !isReduced && info?.tone === "danger";

  useEffect(() => {
    if (!pulses) return;
    const step = { duration: BASE.durationMs, reduceMotion: ReduceMotion.System };
    scale.set(withSequence(withTiming(PULSE_SCALE, step), withTiming(1, step)));
  }, [pulses, scale]);

  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  if (!info) return null;
  const text =
    info.state === "none"
      ? info.when
      : t(K.with_state, { state: t(K[info.state]), when: info.when });
  return (
    <Animated.View style={[SELF_START, pulse]}>
      <Chip
        {...rest}
        variant={variant}
        size={size}
        tone={info.tone}
        accessible
        accessibilityLabel={t(K.with_date, { label: text, date: info.full })}
      >
        {text}
      </Chip>
    </Animated.View>
  );
}
