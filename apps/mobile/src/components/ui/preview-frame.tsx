/**
 * Stackra file contract:
 * Purpose: `PreviewFrame`, the showcase cards' live thumbnail: a 16:10 pane as wide as the card where the demo lays out
 *          in a frame 1/SCALE the pane's size, centred, and is scaled down by SCALE to fill it, so its text stays
 *          readable (a crop of a big demo, never a whole demo squeezed into a few points).
 * Boundary: presentation only; inert to touch and hidden from assistive technology (the card names the component).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 5; STA-1371 (readable thumbnails, 2026-10-28).
 */
import { useState } from "react";
import { View } from "react-native";

import type { PreviewFrameProps } from "./preview-frame.props";

/** How far the demo is scaled down. */
const SCALE = 0.75;

/** A live demo, scaled to a readable thumbnail. */
export function PreviewFrame({ children }: PreviewFrameProps) {
  const [width, setWidth] = useState(0);
  const height = (width * 10) / 16;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="items-center justify-center overflow-hidden bg-surface-secondary"
      style={{ aspectRatio: 16 / 10 }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <View
          className="items-center justify-center p-4"
          style={{ width: width / SCALE, height: height / SCALE, transform: [{ scale: SCALE }] }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}
