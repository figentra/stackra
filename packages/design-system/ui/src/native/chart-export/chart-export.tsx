/**
 * Stackra file contract:
 * Purpose: the native `ChartExport`: wraps any chart of the kit with a share button (a menu of "Share as image" and,
 *          with `data`, "Share as CSV") at its reading-end corner. The image is a snapshot of the chart's view
 *          (Skia's `makeImageFromView`) as a PNG; the CSV is `data` written by `chartCsvOf`. Both go out through the
 *          system share sheet (React Native's `Share`).
 * Boundary: a phone shares rather than downloads, and has no SVG, so `svg` is left out; CSV needs `data`, since a
 *           native chart has no data table to read back. CSV text is guarded against formula injection by `chartCsvOf`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decisions 14 to 18); WCAG 2.2 SC 4.1.2; STA-1371 (gap wave,
 *          2026-10-31).
 */
import { makeImageFromView } from "@shopify/react-native-skia";
import { type ReactElement, useState } from "react";
import { Share, View } from "react-native";

import { ChartExportFormat } from "#contracts/enums/chart-export-format.enum";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { WIDGET_MENU_ICON } from "#core/constants/widget-menu-icon.constant";
import { chartCsvOf } from "#core/functions/chart-csv-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { ActionMenu } from "#native/action-menu/action-menu";
import type { ChartExportProps } from "#native/chart-export/chart-export.props";

/** The chart words' keys. */
const K = UI_KEYS.ui.chart;

/** A chart with a share menu. */
export function ChartExport({
  children,
  fileName,
  formats = ChartExportFormat,
  data,
  label,
  className,
}: ChartExportProps): ReactElement {
  const t = useUiText();
  // The chart view in state, not a ref: the share handlers are built during render and must not read a ref there.
  const [chart, setChart] = useState<View | null>(null);
  const shareImage = async () => {
    const image = await makeImageFromView({ current: chart });
    if (image)
      await Share.share({
        url: `data:image/png;base64,${image.encodeToBase64()}`,
        title: fileName,
      });
  };
  const items = [
    ...(formats.includes("png")
      ? [
          {
            id: "png",
            label: t(K.share_png),
            icon: WIDGET_MENU_ICON.png,
            onPress: () => void shareImage().catch(() => undefined),
          },
        ]
      : []),
    ...(formats.includes("csv") && data
      ? [
          {
            id: "csv",
            label: t(K.share_csv),
            icon: WIDGET_MENU_ICON.csv,
            onPress: () =>
              void Share.share({ message: chartCsvOf(data), title: `${fileName}.csv` }).catch(
                () => undefined,
              ),
          },
        ]
      : []),
  ];
  return (
    <View className={["w-full gap-1", className].filter(Boolean).join(" ")}>
      {items.length > 0 ? (
        <View className="flex-row justify-end">
          <ActionMenu
            size="sm"
            icon="share-2"
            label={label ?? t(K.share)}
            sections={[{ id: "export", title: label ?? t(K.share), isTitleHidden: true, items }]}
          />
        </View>
      ) : null}
      {/* Not collapsed, so the snapshot has a native view to draw. */}
      <View ref={setChart} collapsable={false}>
        {children}
      </View>
    </View>
  );
}
