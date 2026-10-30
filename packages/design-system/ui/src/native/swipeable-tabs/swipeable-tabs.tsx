/**
 * Stackra file contract:
 * Purpose: the native `SwipeableTabs`: the Stackra `Tabs`, whose panel also changes with a horizontal swipe: toward the
 *          reading start for the next tab, toward the reading end for the previous one, the new panel sliding in from
 *          the side it comes from, so the whole gesture mirrors in Arabic. Disabled tabs are skipped.
 * Boundary: builds on `#native/tabs/tabs` (its selection haptic included), controlled from here. The swipe is React
 *           Native's PanResponder on the panel, claiming only clearly horizontal drags, so vertical scrolling inside a
 *           panel still works; the tab list stays the accessible path. Reduced motion drops the slide.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28); WCAG 2.2 SC 2.5.1.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useMemo, useState } from "react";
import { PanResponder } from "react-native";
import Animated, { ReduceMotion, SlideInLeft, SlideInRight } from "react-native-reanimated";
import type { ReactElement } from "react";

import { useDirection } from "#native/bidi/use-direction";
import type { SwipeableTabsProps } from "#native/swipeable-tabs/swipeable-tabs.props";
import { Tabs } from "#native/tabs/tabs";
import { Text } from "#native/text/text";

const BASE = motionTiming(STACKRA_THEME, "base");
/** How far a drag must go before it is a swipe, and how far before it changes the tab, in points. */
const SLOP = 12;
const SWIPE = 48;

/** Tabs whose panels also change with a swipe. */
export function SwipeableTabs({
  items,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  isDisabled = false,
  ...rest
}: SwipeableTabsProps): ReactElement {
  const enabled = items.filter((item) => !item.isDisabled);
  const [ownKeys, setOwnKeys] = useState<readonly string[]>(
    defaultSelectedKeys ?? (enabled[0] ? [enabled[0].id] : []),
  );
  const selected = selectedKeys ?? ownKeys;
  const current = selected[0] ?? enabled[0]?.id;
  const sign = useDirection() === "rtl" ? -1 : 1;
  // 1 when the new panel comes from the reading end (a next tab), -1 from the start.
  const [from, setFrom] = useState<1 | -1>(1);

  const select = (key: string) => {
    const by =
      items.findIndex((item) => item.id === key) > items.findIndex((item) => item.id === current)
        ? 1
        : -1;
    setFrom(by);
    setOwnKeys([key]);
    onSelectionChange?.([key]);
  };
  const step = (by: 1 | -1) => {
    const next = enabled[enabled.findIndex((item) => item.id === current) + by];
    if (next) select(next.id);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          !isDisabled &&
          Math.abs(gesture.dx) > SLOP &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderRelease: (_event, gesture) => {
          const reading = gesture.dx * sign;
          if (reading < -SWIPE) step(1);
          else if (reading > SWIPE) step(-1);
        },
      }),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `step` reads `current`, `enabled` and `select`, which change with the deps below.
    [isDisabled, sign, current, items],
  );
  const entering = (from * sign > 0 ? SlideInRight : SlideInLeft)
    .duration(BASE.durationMs)
    .reduceMotion(ReduceMotion.System);

  return (
    <Tabs
      {...rest}
      isDisabled={isDisabled}
      selectedKeys={current === undefined ? [] : [current]}
      onSelectionChange={(keys) => {
        if (keys[0] !== undefined && keys[0] !== current) select(keys[0]);
      }}
      items={items.map((item) => ({
        ...item,
        content: (
          <Animated.View
            key={item.id === current ? `${item.id}-${from}` : item.id}
            entering={entering}
            {...responder.panHandlers}
            className="flex-1"
          >
            {typeof item.content === "string" ? <Text>{item.content}</Text> : item.content}
          </Animated.View>
        ),
      }))}
    />
  );
}
