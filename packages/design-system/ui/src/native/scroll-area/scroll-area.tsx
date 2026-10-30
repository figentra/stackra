/**
 * Stackra file contract:
 * Purpose: the native `ScrollArea` on HeroUI Native's ScrollShadow: a bounded ScrollView whose edges fade while there
 *          is more to see, painted with `SvgGradient`.
 * Boundary: the ScrollView is named for screen readers; horizontal scrolling follows the layout direction.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-1371.
 */
import { ScrollShadow } from "heroui-native";
import type { ReactElement } from "react";
import { ScrollView } from "react-native";

import type { ScrollAreaProps } from "#native/scroll-area/scroll-area.props";
import { SvgGradient } from "#native/scroll-area/svg-gradient";

/** A region that scrolls with faded edges. */
export function ScrollArea({
  children,
  label,
  orientation = "vertical",
  maxSize,
  fadeSize = 40,
  className,
}: ScrollAreaProps): ReactElement {
  const isVertical = orientation === "vertical";
  return (
    <ScrollShadow
      LinearGradientComponent={SvgGradient}
      orientation={orientation}
      size={fadeSize}
      {...(className ? { className } : {})}
      style={
        maxSize === undefined
          ? undefined
          : isVertical
            ? { maxHeight: maxSize }
            : { maxWidth: maxSize }
      }
    >
      <ScrollView accessibilityLabel={label} horizontal={!isVertical}>
        {children}
      </ScrollView>
    </ScrollShadow>
  );
}
