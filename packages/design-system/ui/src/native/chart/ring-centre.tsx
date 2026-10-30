/**
 * Stackra file contract:
 * Purpose: `RingCentre`, the total and its word in the hole of a native donut or radial chart.
 * Boundary: Text over the canvas, centred, so it shapes Arabic and needs no mirroring; hidden from assistive
 *           technology, which hears the chart's own value.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { Text } from "#native/text/text";

/** The figure above the word, centred over its parent. */
export function RingCentre({
  value,
  word,
}: {
  readonly value: string;
  readonly word: string;
}): ReactElement {
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className="absolute inset-0 items-center justify-center"
    >
      <Text className="text-3xl font-bold tabular-nums">{value}</Text>
      <Text type="caption" tone="muted">
        {word}
      </Text>
    </View>
  );
}
