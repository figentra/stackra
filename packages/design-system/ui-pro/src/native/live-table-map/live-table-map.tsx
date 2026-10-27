/**
 * Stackra file contract:
 * Purpose: the native `LiveTableMap`: one area's floor plan drawn read-only, each table showing its live status in
 *          its tone, the caller's lines (elapsed time, waiter, party size, spend) and whether it is suggested; a table
 *          is a button that reports a press. The web map's contract, on React Native.
 * Boundary: shows, never changes, the plan or a status: the statuses, their words and tones, and the live updates are
 *           the caller's (a pack and realtime). Walls are hidden from screen readers; labels are read as text.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 1.4.1 (a status is a word, never a colour alone).
 */
import { Chip, Text } from "@stackra/ui/native";
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

import { FLOOR_SHAPE_CLASS } from "#core/constants/floor-shape-class.constant";
import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { useUiProText } from "#native/hooks/use-ui-pro-text";
import type { LiveTableMapProps } from "#native/live-table-map/live-table-map.props";

/** One area's tables with their live state. */
export function LiveTableMap({
  label,
  columns,
  rows,
  cellSize = 32,
  items,
  tables,
  onTablePress,
}: LiveTableMapProps): ReactElement {
  const t = useUiProText();
  const live = new Map(tables.map((table) => [table.id, table]));
  const suggested = t(UI_PRO_KEYS.ui_pro.live_table_map.suggested);

  return (
    <View
      testID="live-table-map"
      accessibilityLabel={label}
      className="relative overflow-hidden rounded-lg border border-separator bg-surface-secondary"
      style={{ width: columns * cellSize, height: rows * cellSize }}
    >
      {items.map((item) => {
        const place = {
          position: "absolute" as const,
          insetInlineStart: item.x * cellSize,
          top: item.y * cellSize,
          width: item.width * cellSize,
          height: item.height * cellSize,
        };
        if (item.shape === "wall" || item.shape === "label")
          return (
            <View
              key={item.id}
              importantForAccessibility={item.shape === "wall" ? "no-hide-descendants" : "auto"}
              className={`items-center justify-center ${FLOOR_SHAPE_CLASS[item.shape]}`}
              style={place}
            >
              {item.shape === "label" ? (
                <Text type="caption" tone="muted" isTruncated>
                  {item.label}
                </Text>
              ) : null}
            </View>
          );
        const state = live.get(item.id);
        const words = [
          item.label,
          state?.statusLabel,
          ...(state?.lines ?? []),
          state?.isSuggested === true ? suggested : undefined,
        ].filter((word) => word !== undefined);
        return (
          <Pressable
            key={item.id}
            testID={`table-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={words.join(", ")}
            accessibilityState={{ disabled: onTablePress === undefined }}
            disabled={onTablePress === undefined}
            onPress={() => onTablePress?.(item.id)}
            className={`items-center justify-center gap-0.5 overflow-hidden p-1 ${FLOOR_SHAPE_CLASS[item.shape]} ${state?.isSuggested === true ? "border-2 border-accent" : ""}`}
            style={place}
          >
            <Text type="caption" isTruncated className="font-medium">
              {item.label}
            </Text>
            {state === undefined ? null : (
              <Chip size="sm" tone={state.tone}>
                {state.statusLabel}
              </Chip>
            )}
            {(state?.lines ?? []).map((line) => (
              <Text key={line} type="caption" tone="muted" isTruncated>
                {line}
              </Text>
            ))}
          </Pressable>
        );
      })}
    </View>
  );
}
