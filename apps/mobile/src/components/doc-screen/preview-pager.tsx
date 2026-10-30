/**
 * Stackra file contract:
 * Purpose: the Preview tab of the mobile component screen, the HeroUI Native example-app pattern: a vertical
 *          full-page pager with one live example per page, scale and opacity following the scroll, a medium haptic on
 *          each page change, a page indicator with the example's caption at the end edge, "View code" to the Usage
 *          tab; a press on an indicator mark jumps to its page. Reduced motion keeps the pages flat.
 * Boundary: the pager and its chrome; the demos come from the generated map.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 3.3 (Preview) and section 8 (motion, haptics).
 */
import type { I18nKey } from "@stackra/i18n";
import { componentKeys, type ExampleEntry } from "@stackra/showcase";
import { Button, Icon, Text, useCatalogueText, useHaptic } from "@stackra/ui/native";
import { memo, useContext, useRef, useState } from "react";
import { type FlatList, ScrollView, View, type ViewToken } from "react-native";
import { BottomTabBarHeightContext } from "react-native-bottom-tabs";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from "react-native-reanimated";

import type { ComponentDemos } from "#src/components/doc-screen/component-demos.type";
import { PaginationIndicator } from "#src/components/doc-screen/pagination-indicator";
import type { PreviewPagerProps } from "#src/components/doc-screen/preview-pager.props";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";
import { nativeExamples } from "#src/functions/native-examples.function";

/** A page counts as current once half of it is on screen. */
const VIEWABILITY = { itemVisiblePercentThreshold: 50 } as const;

/** One page: the demo centred, scaled and faded as it leaves the viewport; a demo taller than the page scrolls inside it. */
const Page = memo(function Page({
  demo,
  index,
  scrollY,
  pageHeight,
  isStatic,
  rows,
}: {
  readonly demo: ComponentDemos["examples"][string] | undefined;
  readonly index: number;
  readonly scrollY: SharedValue<number>;
  readonly pageHeight: number;
  readonly isStatic: boolean;
  /** How many examples the indicator list shows under the page. */
  readonly rows: number;
}) {
  const t = useCatalogueText(MESSAGES.en);
  const style = useAnimatedStyle(() => {
    if (isStatic) return { opacity: 1, transform: [{ scale: 1 }] };
    const page = scrollY.get() / pageHeight;
    const around = [index - 0.5, index, index + 0.5];
    return {
      opacity: interpolate(page, around, [0, 1, 0], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(page, around, [0.9, 1, 0.9], Extrapolation.CLAMP) }],
    };
  });
  return (
    <Animated.View style={[{ height: pageHeight }, style]}>
      {/* `flexGrow` keeps a short demo centred; the bottom padding clears the caption and "View code" row. */}
      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerClassName="grow justify-center px-4 pt-4"
        // Clears the indicator list (one 24pt row per example) and the "View code" row under it.
        contentContainerStyle={{ paddingBottom: 72 + rows * 24 }}
      >
        {demo ? (
          <demo.Demo />
        ) : (
          <Text tone="muted">{t(SHOWCASE_KEYS.showcase.ui.planned_note)}</Text>
        )}
      </ScrollView>
    </Animated.View>
  );
});

/** The vertical pager of the entry's examples. */
export function PreviewPager({ entry, demos, onViewCode }: PreviewPagerProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { play } = useHaptic();
  const isStatic = useReducedMotion();
  const tabBar = useContext(BottomTabBarHeightContext) ?? 0;
  const [pageHeight, setPageHeight] = useState(0);
  const examples = nativeExamples(entry);
  const [current, setCurrent] = useState(examples[0]?.id ?? "");
  const list = useRef<FlatList<ExampleEntry>>(null);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });
  const keys = componentKeys(entry);
  const label = (id: string) => {
    const words = keys.examples[id];
    return words ? t(words.title as I18nKey) : id;
  };
  // FlatList refuses a new onViewableItemsChanged after mount, so the handler is made once.
  const [onViewableItemsChanged] = useState(
    () =>
      ({ viewableItems }: { viewableItems: ViewToken<ExampleEntry>[] }) => {
        const first = viewableItems[0]?.item;
        if (!first) return;
        play("medium");
        setCurrent(first.id);
      },
  );

  return (
    <View
      className="flex-1"
      // The pager ends above the floating tab bar, so its last page and the "View code" row are never under it.
      style={{ marginBottom: tabBar }}
      onLayout={(event) => setPageHeight(event.nativeEvent.layout.height)}
    >
      {pageHeight > 0 ? (
        <Animated.FlatList
          ref={list}
          data={examples}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Page
              demo={demos?.examples[item.id]}
              index={index}
              scrollY={scrollY}
              pageHeight={pageHeight}
              isStatic={isStatic}
              rows={examples.length}
            />
          )}
          getItemLayout={(_, index) => ({ length: pageHeight, offset: pageHeight * index, index })}
          snapToInterval={pageHeight}
          decelerationRate="fast"
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={VIEWABILITY}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        />
      ) : null}
      {/* The indicator column at the start edge, also the examples' table of contents; "View code" at the end edge. */}
      <View className="absolute bottom-6 start-4">
        {examples.map((item, index) => (
          <PaginationIndicator
            key={item.id}
            index={index}
            label={label(item.id)}
            scrollY={scrollY}
            pageHeight={pageHeight || 1}
            isStatic={isStatic}
            onPress={() => list.current?.scrollToIndex({ index, animated: !isStatic })}
          />
        ))}
      </View>
      <View className="absolute bottom-6 end-4 items-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          endIcon={<Icon name="arrow-right" />}
          onPress={() => onViewCode(current)}
        >
          {t(SHOWCASE_KEYS.showcase.ui.view_code)}
        </Button>
      </View>
    </View>
  );
}
