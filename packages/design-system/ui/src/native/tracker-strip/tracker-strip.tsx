/**
 * Stackra file contract:
 * Purpose: the native `TrackerStrip`: an uptime-style row of equal cells, one per period, filled by state (up,
 *          degraded, down, no data), with the label and summary above and the start and end captions below; pressing a
 *          cell shows its period, state and note in a readout under the strip, and pressing it again hides it.
 * Boundary: the strip is one accessibility `image` named by the label, whose value speaks the summary and every period
 *           that was not up, so the state never rests on colour alone; the cells themselves are hidden from assistive
 *           technology. The row follows the layout direction, so the oldest cell sits at the right in Arabic. Nothing
 *           animates.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.1; STA-1371.
 */
import { type ReactElement, useState } from "react";
import { Pressable, View } from "react-native";

import type { TrackerCell } from "#contracts/types/tracker-cell.type";
import { TRACKER_CELL_CLASS } from "#core/constants/tracker-cell-class.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { uptimeShareOf } from "#core/functions/uptime-share-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { Text } from "#native/text/text";
import type { TrackerStripProps } from "#native/tracker-strip/tracker-strip.props";

/** The strip's words. */
const K = UI_KEYS.ui.tracker_strip;

/** An uptime-style strip of periods. */
export function TrackerStrip({
  cells,
  label,
  summary,
  startLabel,
  endLabel,
  height = 32,
  className,
}: TrackerStripProps): ReactElement {
  const { locale } = useChartLocale();
  const t = useUiText();
  const [pointed, setPointed] = useState<number | null>(null);
  const share = uptimeShareOf(cells);
  const total =
    summary ??
    (share === null
      ? undefined
      : t(K.uptime, {
          value: formatChartNumber(share, locale, { style: "percent", maximumFractionDigits: 2 }),
        }));
  const textOf = (cell: TrackerCell) =>
    [t(K.cell, { label: cell.label, status: t(K[cell.status]) }), cell.note]
      .filter(Boolean)
      .join(". ");
  const spoken = [total, ...cells.filter((cell) => cell.status !== "up").map(textOf)]
    .filter(Boolean)
    .join("; ");
  const cell = pointed === null ? undefined : cells[pointed];
  return (
    <View className={["gap-2", className].filter(Boolean).join(" ")}>
      <View className="flex-row items-baseline justify-between gap-3">
        <Text type="small" className="font-medium">
          {label}
        </Text>
        {total ? (
          <Text type="small" tone="muted">
            {total}
          </Text>
        ) : null}
      </View>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={label}
        accessibilityValue={{ text: spoken }}
        className="flex-row gap-0.5"
        style={{ height }}
      >
        {cells.map((item, index) => (
          <Pressable
            key={item.key}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            onPress={() => setPointed(pointed === index ? null : index)}
            className={[
              "flex-1 rounded-[var(--radius-control-inner)]",
              TRACKER_CELL_CLASS[item.status],
              pointed !== null && pointed !== index ? "opacity-50" : "",
            ].join(" ")}
          />
        ))}
      </View>
      {startLabel || endLabel ? (
        <View className="flex-row justify-between gap-3">
          <Text type="small" tone="muted">
            {startLabel}
          </Text>
          <Text type="small" tone="muted">
            {endLabel}
          </Text>
        </View>
      ) : null}
      {cell ? (
        <View accessibilityLiveRegion="polite" className="flex-row items-center gap-2">
          <View
            className={[
              "size-2 rounded-[var(--radius-pill)]",
              TRACKER_CELL_CLASS[cell.status],
            ].join(" ")}
          />
          <Text type="small">{textOf(cell)}</Text>
        </View>
      ) : null}
    </View>
  );
}
