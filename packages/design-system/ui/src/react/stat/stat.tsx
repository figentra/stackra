/**
 * Stackra file contract:
 * Purpose: the web `Stat`: one headline figure with its label above and an optional badge beside it, for a dashboard
 *          tile or a widget (`<Stat label="Points" value={1200} badge="Gold" />`), drawn with the design system's
 *          `Text` and `Chip`; with the KPI extras a trend chip, an area sparkline, a target bar and a drill-down.
 * Boundary: no HeroUI component of its own (HeroUI v3 has no stat); the label is read before the figure. A number is
 *           formatted in the `DesignSystemProvider`'s locale and the i18n digits setting (`useNumerals`), or the
 *           browser's without one. A drill-down makes the whole tile one button; a number counts up with
 *           `NumberTicker` at the motion level in force (still under `none`).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0307 (decision 15); owner decision 6 of STA-350
 *          (thin wrappers).
 */
import { formatNumber } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { type ReactElement, use, useId } from "react";
import { Button as AriaButton } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { Chip } from "#react/chip/chip";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { useUiText } from "#react/hooks/use-ui-text";
import { TrendChip } from "#react/kpi/trend-chip";
import { NumberTicker } from "#react/number-ticker/number-ticker";
import { ProgressBar } from "#react/progress-bar/progress-bar";
import { Sparkline } from "#react/sparkline/sparkline";
import { Text } from "#react/text/text";
import type { StatProps } from "#react/stat/stat.props";

/** A labelled headline figure. */
export function Stat({
  label,
  value,
  badge,
  trend,
  better,
  comparison,
  sparkline,
  target,
  onPress,
  pressLabel,
}: StatProps): ReactElement {
  const locale =
    use(DesignSystemContext)?.locale ?? new Intl.NumberFormat().resolvedOptions().locale;
  const numerals = useNumerals();
  const t = useUiText();
  const hintId = useId();
  const format = (figure: number) => formatNumber(figure, locale, undefined, numerals);
  const name = typeof label === "string" ? label : "";
  const body = (
    <div className="flex flex-col gap-1 text-start">
      <Text type="small" tone="muted">
        {label}
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-3xl font-semibold tabular-nums">
          {typeof value === "number" ? <NumberTicker value={value} /> : value}
        </span>
        {badge ? <Chip size="sm">{badge}</Chip> : null}
        {trend === undefined ? null : (
          <TrendChip value={trend} better={better} comparison={comparison} />
        )}
      </div>
      {sparkline && sparkline.length > 1 ? (
        <Sparkline
          data={sparkline}
          kind="area"
          color="chart-ramp-2"
          height={36}
          label={name}
          className="mt-1"
        />
      ) : null}
      {target !== undefined && typeof value === "number" ? (
        <ProgressBar
          size="sm"
          value={Math.min(value, target)}
          maxValue={target}
          label={t(UI_KEYS.ui.stat.target, { value: format(target) })}
          isLabelVisible
          className="mt-1"
        />
      ) : null}
    </div>
  );
  if (!onPress) return body;
  return (
    // Named by what it shows (WCAG 2.5.3, label in name: a voice user says what they see), described by what it does.
    <AriaButton
      onPress={onPress}
      {...(pressLabel || name ? { "aria-describedby": hintId } : {})}
      className="-m-2 block w-[calc(100%+1rem)] cursor-pointer rounded-lg p-2 outline-none hover:bg-default/40 focus-visible:ring-2 focus-visible:ring-focus"
    >
      {body}
      {pressLabel || name ? (
        <span id={hintId} hidden>
          {pressLabel ?? t(UI_KEYS.ui.stat.drill_down, { label: name })}
        </span>
      ) : null}
    </AriaButton>
  );
}
