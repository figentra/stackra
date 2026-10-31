/**
 * Stackra file contract:
 * Purpose: the web `WordCloud`: words sized by weight and set by `wordCloudLayoutOf`, the heaviest in the middle, each
 *          in the palette by weight order; pointing at a word shows its figure. Every word (placed or not) also in a
 *          data table with its weight.
 * Boundary: SVG text at the measured width (`usePlotWidth`), so words keep their shape and Arabic is shaped by the
 *           browser; words are flat, never turned. The spiral mirrors right to left. No motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11;
 *          STA-1371 (gap wave, 2026-10-31).
 */
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { wordCloudLayoutOf } from "#core/functions/word-cloud-layout-of.function";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { usePlotWidth } from "#react/chart/use-plot-width";
import { useUiText } from "#react/hooks/use-ui-text";
import type { WordCloudProps } from "#react/word-cloud/word-cloud.props";

/** Words sized by weight. */
export function WordCloud({
  words,
  label,
  valueFormat,
  palette,
  height = 260,
  className,
}: WordCloudProps): ReactElement {
  const { locale, isRtl, words: heads } = useChartLocale();
  const t = useUiText();
  const { width, ref } = usePlotWidth();
  const layout = wordCloudLayoutOf(words, { width, height, isRtl });
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const table = {
    head: [t(UI_KEYS.ui.chart.word), heads.value],
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy built here; toSorted is ES2023 and the base lib is ES2022
    rows: [...words].sort((a, b) => b.value - a.value).map((word) => [word.text, value(word.value)]),
  };
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <div ref={ref} className="w-full">
        <svg
          role="img"
          aria-label={label}
          data-chart="word-cloud"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block"
        >
          {layout.words.map((placed) => (
            <text
              key={placed.word.text}
              x={placed.x}
              y={placed.y}
              dy="0.35em"
              textAnchor="middle"
              fontSize={placed.fontSize}
              fill={paintOf(placed.word.color ?? chartColorOf(undefined, placed.rank, palette))}
              className="font-semibold transition-opacity duration-(--duration-fast) hover:opacity-70 motion-reduce:transition-none"
            >
              <title>{`${placed.word.text}: ${value(placed.word.value)}`}</title>
              {placed.word.text}
            </text>
          ))}
        </svg>
      </div>
    </ChartFrame>
  );
}
