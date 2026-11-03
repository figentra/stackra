/**
 * Stackra file contract:
 * Purpose: the dots of a dot loader on native: rows of square dots lit in floor order, the emphasis dot in its own
 *          colour, laid out in the provider's text direction.
 * Boundary: drawing only, hidden from VoiceOver and TalkBack; the owning component carries the role, name and value.
 *          Not exported from `./native`.
 * Runtime: react-native
 * Governing contract: .agents/specs/sta-2017-dot-loader/spec.md (FR-002 to FR-006)
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { DOT_LOADER } from "#core/constants/dot-loader.constant";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";

interface DotGridProps {
  /** Columns and rows; floor order is the bottom row first, each row from the inline start. */
  readonly cols: number;
  readonly rows: number;
  /** The dot's side in points. */
  readonly dot: number;
  /** The gap in points; omit it to spread the dots across the full width (a bar). */
  readonly gap?: number | undefined;
  /** How many dots are lit, in floor order. */
  readonly lit: number;
  /** The floor-order index of the dot drawn in the emphasis colour, or -1 for none. */
  readonly emphasisAt: number;
  readonly color: string;
  readonly emphasis: string;
}

/** Rows of dots; the provider's direction lays each row out, so in right-to-left a row fills from the right. */
export function DotGrid({
  cols,
  rows,
  dot,
  gap,
  lit,
  emphasisAt,
  color,
  emphasis,
}: DotGridProps): ReactElement {
  const { direction } = useDesignSystem();
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ direction, gap: gap ?? 0 }}
    >
      {Array.from({ length: rows }, (_row, row) => (
        <View
          key={row}
          style={{
            flexDirection: "row",
            gap: gap ?? 0,
            justifyContent: gap === undefined ? "space-between" : "flex-start",
          }}
        >
          {Array.from({ length: cols }, (_col, col) => {
            const floor = (rows - 1 - row) * cols + col;
            return (
              <View
                key={col}
                style={{
                  width: dot,
                  height: dot,
                  backgroundColor: floor === emphasisAt ? emphasis : color,
                  opacity: floor < lit ? 1 : DOT_LOADER.unlitOpacity,
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}
