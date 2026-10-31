/**
 * Stackra file contract:
 * Purpose: the native `Stat`: one headline figure with its label above and an optional badge beside it, for a card
 *          or a widget (`<Stat label="Points" value={1200} badge="Gold" />`), drawn with the design system's `Text` and
 *          `Chip`, the same props as on web, KPI extras included: trend chip,
 *          previous period (the trend worked out from it when none is given), area sparkline, target bar, drill-down.
 * Boundary: no HeroUI Native component of its own (HeroUI Native has no stat); the label is read before the figure. A
 *           number is formatted in the `DesignSystemProvider`'s locale and the i18n digits setting (`useNumerals`), or
 *           the device's without one. A drill-down makes the tile one pressable button; a number counts up with
 *           `NumberTicker` at the motion level in force (still under `none`).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0307 (decision 15); owner decision 6 of STA-350
 *          (thin wrappers).
 */
import { formatNumber } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { type ReactElement, use } from "react";
import { Pressable, View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { changeOf } from "#core/functions/change-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Chip } from "#native/chip/chip";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { TrendChip } from "#native/kpi/trend-chip";
import { NumberTicker } from "#native/number-ticker/number-ticker";
import { ProgressBar } from "#native/progress-bar/progress-bar";
import { Sparkline } from "#native/sparkline/sparkline";
import { Text } from "#native/text/text";
import type { StatProps } from "#native/stat/stat.props";

/** A labelled headline figure. */
export function Stat({
  label,
  value,
  badge,
  trend,
  previousValue,
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
  const format = (figure: number) => formatNumber(figure, locale, undefined, numerals);
  const name = typeof label === "string" ? label : "";
  const change = trend ?? changeOf(value, previousValue);
  const body = (
    <View className="gap-1">
      <Text type="small" tone="muted">
        {label}
      </Text>
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="text-metric font-semibold">
          {typeof value === "number" ? <NumberTicker value={value} /> : value}
        </Text>
        {badge ? <Chip size="sm">{badge}</Chip> : null}
        {change === undefined ? null : (
          <TrendChip value={change} better={better} comparison={comparison} />
        )}
      </View>
      {previousValue === undefined ? null : (
        <Text type="small" tone="muted">
          {t(UI_KEYS.ui.stat.previous, { value: format(previousValue) })}
        </Text>
      )}
      {sparkline && sparkline.length > 1 ? (
        <Sparkline data={sparkline} kind="area" color="chart-ramp-2" height={36} label={name} />
      ) : null}
      {target !== undefined && typeof value === "number" ? (
        <ProgressBar
          size="sm"
          value={Math.min(value, target)}
          maxValue={target}
          label={t(UI_KEYS.ui.stat.target, { value: format(target) })}
          isLabelVisible
        />
      ) : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        pressLabel ?? (name ? t(UI_KEYS.ui.stat.drill_down, { label: name }) : undefined)
      }
      className="-m-2 rounded-[var(--radius-control)] p-2 active:bg-default/40"
    >
      {body}
    </Pressable>
  );
}
