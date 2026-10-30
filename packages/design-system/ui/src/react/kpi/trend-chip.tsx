/**
 * Stackra file contract:
 * Purpose: the web `TrendChip`: a soft chip with a trend arrow and a signed change ("+12%"), green or red by the
 *          direction that is better, read in words ("Up 12%, vs last month").
 * Boundary: the visible chip is hidden from assistive technology and the words are read instead, so the arrow and the
 *           colour are never the only signal (WCAG 1.4.1).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decision 15); WCAG 2.2 SC 1.4.1; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";
import { VisuallyHidden } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { trendOf } from "#core/functions/trend-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { Chip } from "#react/chip/chip";
import { useUiText } from "#react/hooks/use-ui-text";
import type { TrendChipProps } from "#react/kpi/trend-chip.props";

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
  const shown = formatChartNumber(value, locale, format);
  const unsigned = formatChartNumber(Math.abs(value), locale, { ...format, signDisplay: "never" });
  const K = UI_KEYS.ui.trend_chip;
  const words = trend.direction === "flat" ? t(K.flat) : t(K[trend.direction], { value: unsigned });
  return (
    <span data-slot="trend-chip" className={cn("inline-flex", className)}>
      <span aria-hidden className="inline-flex">
        <Chip size="sm" variant="soft" tone={trend.tone} startIcon={trend.icon}>
          <span className="tabular-nums">{shown}</span>
        </Chip>
      </span>
      <VisuallyHidden>{comparison ? `${words}, ${comparison}` : words}</VisuallyHidden>
      {comparison ? (
        <span aria-hidden className="ms-1.5 self-center text-xs text-muted">
          {comparison}
        </span>
      ) : null}
    </span>
  );
}
