/**
 * Stackra file contract:
 * Purpose: the native `NumberTicker`: a number that counts from where it stands to its `value`, easing out, written in
 *          the `DesignSystemProvider`'s locale and the i18n digits setting on every frame, with tabular figures so the
 *          width holds still.
 * Boundary: a `Text` whose accessible label is the final value, so VoiceOver and TalkBack read it once and never the
 *           frames. The count runs on `requestAnimationFrame` in JavaScript, one state update a frame: fine for a
 *           headline figure, not for a list of them. Below the `full` motion level it shows the value at once.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); ADR 0060 (digits); WCAG 2.2 SC 2.3.3.
 */
import { formatNumber } from "@stackra/i18n";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useNumerals } from "@stackra/i18n/react";
import { type ReactElement, use, useEffect, useRef, useState } from "react";

import { tickerValueOf } from "#core/functions/ticker-value-of.function";
import { tweenNumber } from "#core/functions/tween-number.function";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { useMotion } from "#native/design-system-provider/use-motion";
import type { NumberTickerProps } from "#native/number-ticker/number-ticker.props";
import { Text } from "#native/text/text";

/** The default count-up length: the theme's count step. */
const COUNT_MS = motionTiming(STACKRA_THEME, "count").durationMs;

/** A number that counts to its value. */
export function NumberTicker({
  value,
  from = 0,
  duration = COUNT_MS,
  format,
}: NumberTickerProps): ReactElement {
  const locale =
    use(DesignSystemContext)?.locale ?? new Intl.NumberFormat().resolvedOptions().locale;
  const numerals = useNumerals();
  const motion = useMotion();
  const [shown, setShown] = useState(motion === "full" ? from : value);
  const onScreen = useRef(shown);
  useEffect(() => {
    const start = onScreen.current;
    return tweenNumber(start, value, motion === "full" ? duration : 0, (frame) => {
      onScreen.current = frame;
      setShown(tickerValueOf(frame, start, value, format));
    });
  }, [value, duration, motion, format]);
  const write = (figure: number) => formatNumber(figure, locale, format, numerals);
  return (
    <Text className="tabular-nums" accessibilityLabel={write(value)}>
      {write(shown)}
    </Text>
  );
}
