/**
 * Stackra file contract:
 * Purpose: the "scroll-view" demo of the native BackToTop: a scroll view of 30 orders; once scrolled 200 points the
 *          button shows in its bottom end corner and scrolls it back to the top.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { BackToTop, Heading, Text, useCatalogueText } from "@stackra/ui/native";
import { useRef, useState } from "react";
import { ScrollView, View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { BACK_TO_TOP_DEMO_KEYS } from "#src/demos/free/back-to-top/back-to-top-demo-keys.constant";

/** The demo's keys. */
const K = BACK_TO_TOP_DEMO_KEYS.demo_free.back_to_top.scroll_view;

/** Order numbers, newest first. */
const ORDERS = Array.from({ length: 30 }, (_, position) => 2048 - position);

/** BackToTop: on a scroll view. */
export default function ScrollViewDemo() {
  const t = useCatalogueText(MESSAGES.en);
  const scroller = useRef<ScrollView>(null);
  const [offsetY, setOffsetY] = useState(0);
  return (
    <View className="h-80">
      <ScrollView
        ref={scroller}
        scrollEventThrottle={32}
        onScroll={(event) => setOffsetY(event.nativeEvent.contentOffset.y)}
      >
        <Heading level={3} className="pb-2">
          {t(K.title)}
        </Heading>
        {ORDERS.map((number) => (
          <View key={number} className="flex-row justify-between border-t border-separator py-3">
            <Text>{t(K.order, { number })}</Text>
            <Text tone="muted">{t(K.status)}</Text>
          </View>
        ))}
      </ScrollView>
      <BackToTop
        scrollRef={scroller}
        offsetY={offsetY}
        threshold={200}
        className="end-2 bottom-2"
      />
    </View>
  );
}
