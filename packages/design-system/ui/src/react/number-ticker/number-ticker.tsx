/**
 * Stackra file contract:
 * Purpose: the web `NumberTicker`: a number that counts from where it stands to its `value`, easing out, written in
 *          the `DesignSystemProvider`'s locale and the i18n digits setting on every frame, with tabular figures so the
 *          width holds still.
 * Boundary: the count is drawn hidden from assistive technology and the final value is read once, from a visually
 *           hidden copy, so a screen reader never hears the frames. Below the `full` motion level it shows the value
 *           at once. A change of `value` counts on from the number on screen.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); ADR 0060 (digits); WCAG 2.2 SC 2.3.3 and 1.3.1.
 */
import { formatNumber } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { type ReactElement, use, useEffect, useRef, useState } from "react";

import { tickerValueOf } from "#core/functions/ticker-value-of.function";
import { tweenNumber } from "#core/functions/tween-number.function";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { useMotion } from "#react/design-system-provider/use-motion";
import type { NumberTickerProps } from "#react/number-ticker/number-ticker.props";

const COUNT = motionTiming(STACKRA_THEME, "count");

/** A number that counts to its value. */
export function NumberTicker({
  value,
  from = 0,
  duration = COUNT.durationMs,
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
    <span className="tabular-nums" data-slot="number-ticker">
      <span aria-hidden="true">{write(shown)}</span>
      <span className="sr-only">{write(value)}</span>
    </span>
  );
}
