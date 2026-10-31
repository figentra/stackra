/**
 * Stackra file contract:
 * Purpose: the native `WordCloud`: words sized by weight and set by `wordCloudLayoutOf`, the heaviest in the middle,
 *          each in the palette by weight order; one image whose value reads every word with its weight.
 * Boundary: each word is RN Text placed over the box (no canvas: Skia text has no bidi, so Arabic must be platform
 *           text); words are flat, never turned. The spiral mirrors right to left. No motion.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { isArabic } from "#core/functions/is-arabic.function";
import { wordCloudLayoutOf } from "#core/functions/word-cloud-layout-of.function";
import { useCanvasSize } from "#native/chart/use-canvas-size";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import { Text } from "#native/text/text";
import type { WordCloudProps } from "#native/word-cloud/word-cloud.props";

/** A line's height in ems, as the layout counts it. */
const LINE = 1.1;

/** Words sized by weight. */
export function WordCloud({
  words,
  label,
  valueFormat,
  palette,
  height = 260,
  className,
}: WordCloudProps): ReactElement {
  const { locale, isRtl } = useChartLocale();
  const { width, onLayout } = useCanvasSize();
  const layout = wordCloudLayoutOf(words, { width, height, isRtl });
  const paint = useChartPaint(
    layout.words.map((placed) => placed.word.color ?? chartColorOf(undefined, placed.rank, palette)),
  );
  const spoken = [...words]
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy built here; toSorted is ES2023 and the base lib is ES2022
    .sort((a, b) => b.value - a.value)
    .map((word) => `${word.text} ${formatChartNumber(word.value, locale, valueFormat)}`)
    .join(isArabic(locale) ? "، " : ", ");
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityValue={{ text: spoken }}
      onLayout={onLayout}
      className={["w-full", className].filter(Boolean).join(" ")}
      style={{ height }}
    >
      {width > 0
        ? layout.words.map((placed, index) => (
            <View
              key={placed.word.text}
              pointerEvents="none"
              className="absolute items-center justify-center"
              style={{
                left: placed.x - width,
                top: placed.y - (placed.fontSize * LINE) / 2,
                width: width * 2,
              }}
            >
              <Text
                numberOfLines={1}
                className="font-semibold"
                style={{
                  fontSize: placed.fontSize,
                  lineHeight: placed.fontSize * LINE,
                  color: paint.series[index] ?? paint.foreground,
                }}
              >
                {placed.word.text}
              </Text>
            </View>
          ))
        : null}
    </View>
  );
}
