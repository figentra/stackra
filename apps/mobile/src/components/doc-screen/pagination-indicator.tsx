/**
 * Stackra file contract:
 * Purpose: one mark of the preview pager's page indicator: a short bar that grows and brightens as its page comes
 *          into view, with the page's caption beside it while it is current (the HeroUI Native example-app pattern).
 * Boundary: one animated mark; the pager owns the scroll value.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 3.3 (Preview) and section 8 (motion).
 */
import { Text } from "@stackra/ui/native";
import { Pressable } from "react-native";
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from "react-native-reanimated";

import type { PaginationIndicatorProps } from "#src/components/doc-screen/pagination-indicator.props";

/** A bar that grows as its page comes into view, and the caption of the current page. */
export function PaginationIndicator({
  index,
  label,
  scrollY,
  pageHeight,
  isStatic,
  onPress,
}: PaginationIndicatorProps) {
  const around = [index - 2, index - 1, index, index + 1, index + 2];
  const bar = useAnimatedStyle(() => {
    const page = scrollY.get() / pageHeight;
    return {
      opacity: interpolate(page, around, [0.2, 0.5, 1, 0.5, 0.2], Extrapolation.CLAMP),
      transform: [
        {
          scaleX: isStatic
            ? 1
            : interpolate(page, around, [1, 1.4, 2, 1.4, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });
  const caption = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.get() / pageHeight,
      [index - 0.5, index, index + 0.5],
      [0, 1, 0],
      Extrapolation.CLAMP,
    ),
  }));
  return (
    // The marks are the examples' table of contents: a press jumps to that page.
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      // Wide on both sides: the caption sits after the mark, on the right in English and the left in Arabic.
      hitSlop={{ top: 4, bottom: 4, left: 120, right: 120 }}
      className="h-6 flex-row items-center gap-3"
    >
      <Animated.View
        className="h-0.5 w-3 bg-foreground"
        style={[{ transformOrigin: "0% 50%" }, bar]}
      />
      <Animated.View className="absolute start-8" style={caption}>
        <Text numberOfLines={1} className="font-semibold">
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
