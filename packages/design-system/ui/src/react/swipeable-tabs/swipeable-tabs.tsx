/**
 * Stackra file contract:
 * Purpose: the web `SwipeableTabs`: the Stackra `Tabs`, whose panel also changes with a horizontal touch or pen swipe:
 *          toward the reading start for the next tab, toward the reading end for the previous one, disabled tabs
 *          skipped; the new panel slides in from the side it comes from (Motion, the theme's `base` step).
 * Boundary: builds on `#react/tabs/tabs`, controlled from here. Mouse drags are left to text selection; the tab list and
 *           its arrow keys stay the accessible path. Reduced motion drops the slide.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28); WCAG 2.2 SC 2.5.1.
 */
import type { ReactElement } from "react";
import { motionEasing, motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { useLocale } from "react-aria-components";

import type { SwipeableTabsProps } from "#react/swipeable-tabs/swipeable-tabs.props";
import { Tabs } from "#react/tabs/tabs";

const BASE = motionTiming(STACKRA_THEME, "base");
const ENTER_EASE = motionEasing(STACKRA_THEME, "enter");
/** How far a swipe must go, and by how much it must beat the vertical move, in CSS pixels. */
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
  const current = (selectedKeys ?? ownKeys)[0] ?? enabled[0]?.id;
  const sign = useLocale().direction === "rtl" ? -1 : 1;
  const isReduced = useReducedMotion() === true;
  const [from, setFrom] = useState<1 | -1>(1);
  const start = useRef<{ x: number; y: number } | null>(null);

  const indexOf = (id: string | undefined) => items.findIndex((item) => item.id === id);
  const select = (key: string) => {
    setFrom(indexOf(key) > indexOf(current) ? 1 : -1);
    setOwnKeys([key]);
    onSelectionChange?.([key]);
  };
  const step = (by: 1 | -1) => {
    const next = enabled[enabled.findIndex((item) => item.id === current) + by];
    if (next) select(next.id);
  };

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
          <motion.div
            key={`${item.id}-${from}`}
            initial={isReduced ? false : { opacity: 0, x: 32 * from * sign }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: BASE.durationMs / 1000, ease: ENTER_EASE }}
            className="touch-pan-y"
            onPointerDown={(event) => {
              start.current =
                event.pointerType === "mouse" || isDisabled
                  ? null
                  : { x: event.clientX, y: event.clientY };
            }}
            onPointerUp={(event) => {
              const origin = start.current;
              start.current = null;
              if (!origin) return;
              const dx = event.clientX - origin.x;
              if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(event.clientY - origin.y) * 1.5)
                return;
              step(dx * sign < 0 ? 1 : -1);
            }}
          >
            {item.content}
          </motion.div>
        ),
      }))}
    />
  );
}
