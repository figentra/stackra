/**
 * Stackra file contract:
 * Purpose: the native `TrendChip`: a soft chip with a trend arrow and a signed change, green or red by the direction
 *          that is better, spoken in words ("Up 12%, vs last month"), with the comparison beside it.
 * Boundary: one accessible element; the arrow and colour are never the only signal.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0307 (decision 15); WCAG 2.2 SC 1.4.1; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { trendOf } from "#core/functions/trend-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { Chip } from "#native/chip/chip";
import type { TrendChipProps } from "#native/kpi/trend-chip.props";
import { Text } from "#native/text/text";

/** The default way a change is written: a signed percent. */
const PERCENT: Intl.NumberFormatOptions = {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
};

/** A change against the previous period. */
export function TrendChip({
  value,
  better,
  format = PERCENT,
  comparison,
  className,
}: TrendChipProps): ReactElement {
  const { locale } = useChartLocale();
  const t = useUiText();
  const trend = trendOf(value, better);
  const unsigned = formatChartNumber(Math.abs(value), locale, { ...format, signDisplay: "never" });
  const K = UI_KEYS.ui.trend_chip;
  const words = trend.direction === "flat" ? t(K.flat) : t(K[trend.direction], { value: unsigned });
  return (
    <View
      accessible
      accessibilityLabel={comparison ? `${words}, ${comparison}` : words}
      className={["flex-row items-center gap-1.5", className].filter(Boolean).join(" ")}
    >
      <Chip size="sm" variant="soft" tone={trend.tone} startIcon={trend.icon}>
        {formatChartNumber(value, locale, format)}
      </Chip>
      {comparison ? (
        <Text type="caption" tone="muted">
          {comparison}
        </Text>
      ) : null}
    </View>
  );
}
