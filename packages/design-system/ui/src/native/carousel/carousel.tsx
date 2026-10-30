/**
 * Stackra file contract:
 * Purpose: the native `Carousel`: a paging horizontal scroll of full-width slides with previous and next buttons and
 *          page dots; each slide is announced as "Slide 2 of 5".
 * Boundary: never auto-advances. Paging is the platform's; scrolling animates only without Reduce Motion.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); WCAG 2.2 SC 2.2.2; STA-1371.
 */
import { type ReactElement, useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { CarouselProps } from "#native/carousel/carousel.props";
import { IconButton } from "#native/icon-button/icon-button";

/** K: the carousel's words. */
const K = UI_KEYS.ui.carousel;

/** Slides that page. */
export function Carousel({
  children,
  label,
  showDots = true,
  showArrows = true,
  onIndexChange,
  className,
}: CarouselProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion();
  const scroller = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const count = children.length;
  const goTo = (next: number) => {
    const target = Math.max(0, Math.min(count - 1, next));
    scroller.current?.scrollTo({ x: target * width, animated: !isReduced });
  };
  // shortcut: offsets are taken as logical (iOS mirrors a right-to-left scroll view); check Android RTL on device.
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) {
      setIndex(next);
      onIndexChange?.(next);
    }
  };
  return (
    <View
      accessibilityLabel={label}
      className={["w-full gap-3", className].filter(Boolean).join(" ")}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        className="rounded-xl"
      >
        {children.map((slide, position) => (
          <View
            // oxlint-disable-next-line react/no-array-index-key -- slides are anonymous children; the carousel pages by position
            key={position}
            accessibilityLabel={t(K.slide, { index: position + 1, count })}
            style={{ width }}
          >
            {slide}
          </View>
        ))}
      </ScrollView>
      {showArrows || showDots ? (
        <View className="flex-row items-center justify-between">
          {showArrows ? (
            <IconButton
              icon="chevron-left"
              label={t(K.previous)}
              variant="ghost"
              size="sm"
              isDisabled={index === 0}
              onPress={() => goTo(index - 1)}
            />
          ) : (
            <View />
          )}
          {showDots ? (
            <View accessibilityLabel={t(K.pages)} className="flex-row items-center gap-1.5">
              {children.map((_, position) => (
                <Pressable
                  // oxlint-disable-next-line react/no-array-index-key -- slides are anonymous children; the carousel pages by position
                  key={position}
                  accessibilityRole="button"
                  accessibilityLabel={t(K.slide, { index: position + 1, count })}
                  accessibilityState={{ selected: position === index }}
                  hitSlop={8}
                  onPress={() => goTo(position)}
                  className={[
                    "h-2 rounded-full",
                    position === index ? "w-5 bg-foreground" : "w-2 bg-default",
                  ].join(" ")}
                />
              ))}
            </View>
          ) : null}
          {showArrows ? (
            <IconButton
              icon="chevron-right"
              label={t(K.next)}
              variant="ghost"
              size="sm"
              isDisabled={index >= count - 1}
              onPress={() => goTo(index + 1)}
            />
          ) : (
            <View />
          )}
        </View>
      ) : null}
    </View>
  );
}
