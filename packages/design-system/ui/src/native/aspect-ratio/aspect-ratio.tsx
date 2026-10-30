/**
 * Stackra file contract:
 * Purpose: the native `AspectRatio`: a full-width box held at a width to height ratio (the `aspectRatio` style), so
 *          images and videos keep their shape and the screen does not jump while they load.
 * Boundary: layout only. The child fills the box when it stretches (`flex-1`, or an image at 100% by 100%).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import type { AspectRatioProps } from "#native/aspect-ratio/aspect-ratio.props";

/** A box that keeps its shape. */
export function AspectRatio({ children, ratio = 1, className }: AspectRatioProps): ReactElement {
  return (
    <View
      style={{ aspectRatio: ratio }}
      className={["w-full overflow-hidden rounded-[var(--radius-container)]", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </View>
  );
}
