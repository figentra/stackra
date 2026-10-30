/**
 * Stackra file contract:
 * Purpose: the web `OverflowToolbar` on HeroUI v3's Toolbar: the actions as `Button`s in priority order, as many as fit
 *          the width, and the rest in an `ActionMenu` at the row's end. An invisible copy of the row measures every
 *          button; a ResizeObserver refits on every change of the width or of the words (a locale switch, a font
 *          load). A button that moves into or out of the menu fades and scales with Motion at the theme's `fast` step,
 *          and the others slide to their places; under reduced motion it moves at once.
 * Boundary: builds on `#react/button/button` and `#react/action-menu/action-menu`; the measuring copy is `inert`, so
 *           it is never focused or read. React Aria's Toolbar moves focus with the arrow keys and flips them in RTL,
 *           and the row itself follows the reading direction, so the menu sits at the reading end.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0329 (motion layer); design-system gap inventory row 33;
 *          WCAG 2.2 SC 1.4.10, 2.1.1, 4.1.2.
 */
import type { ReactElement } from "react";
import { cn, Toolbar } from "@heroui/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { overflowFitCount } from "#core/functions/overflow-fit-count.function";
import { ActionMenu } from "#react/action-menu/action-menu";
import { Button } from "#react/button/button";
import { IconButton } from "#react/icon-button/icon-button";
import type { OverflowToolbarProps } from "#react/overflow-toolbar/overflow-toolbar.props";

const FAST = motionTiming(STACKRA_THEME, "fast");
const TRANSITION = { duration: FAST.durationMs / 1000, ease: FAST.bezier ?? "easeOut" } as const;
const HIDDEN = { opacity: 0, scale: 0.9 };
const SHOWN = { opacity: 1, scale: 1 };

/** A named row of actions that keeps the first ones as buttons and moves the rest into a "more" menu when narrow. */
export function OverflowToolbar({
  label,
  items,
  moreLabel,
  variant = "tertiary",
  size,
  onAction,
  className,
  ...rest
}: OverflowToolbarProps): ReactElement {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(items.length);
  // Nothing animates until the first fit, so the row never plays its first narrowing on load.
  const [hasFit, setHasFit] = useState(false);
  const isReduced = useReducedMotion() ?? false;
  const plays = hasFit && !isReduced;

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return undefined;
    const fit = () => {
      const widths = Array.from(measure.children, (child) => child.getBoundingClientRect().width);
      const moreWidth = widths.pop() ?? 0;
      const gap = Number.parseFloat(getComputedStyle(measure).columnGap) || 0;
      setCount(overflowFitCount(widths, row.clientWidth, moreWidth, gap));
      setHasFit(true);
    };
    fit();
    if (typeof ResizeObserver === "undefined") {
      // Fallback without ResizeObserver: refit when the window resizes.
      window.addEventListener("resize", fit);
      return () => window.removeEventListener("resize", fit);
    }
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    observer.observe(measure);
    return () => observer.disconnect();
    // Once: new actions, words, size or variant resize the measuring row, which the observer refits on.
  }, []);

  const visible = items.slice(0, count);
  const overflow = items.slice(count);
  const shared = { variant, ...omitUndefined({ size }) };

  return (
    <div
      {...rest}
      ref={rowRef}
      data-slot="overflow-toolbar"
      // inline-size containment: the row takes its container's width and never grows to its buttons' width.
      className={cn("relative w-full min-w-0 [contain:inline-size]", className)}
    >
      {/* The clipped zero-height box keeps the measuring copy from widening the page. */}
      <div
        inert
        aria-hidden
        className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden"
      >
        <div ref={measureRef} className="flex w-max gap-2 whitespace-nowrap">
          {items.map((item) => (
            <Button key={item.id} {...shared} {...omitUndefined({ startIcon: item.icon })}>
              {item.label}
            </Button>
          ))}
          <IconButton icon="ellipsis" label={moreLabel} {...shared} />
        </div>
      </div>
      <Toolbar aria-label={label} className="flex min-w-0 flex-nowrap items-center gap-2">
        <AnimatePresence initial={false}>
          {visible.map((item) => (
            <motion.div
              key={item.id}
              layout={plays}
              initial={plays ? HIDDEN : false}
              animate={SHOWN}
              exit={plays ? HIDDEN : { opacity: 0, transition: { duration: 0 } }}
              transition={TRANSITION}
            >
              <Button
                {...shared}
                onPress={() => {
                  item.onPress?.();
                  onAction?.(item.id);
                }}
                {...omitUndefined({ startIcon: item.icon, isDisabled: item.isDisabled })}
              >
                {item.label}
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
        {overflow.length === 0 ? null : (
          <ActionMenu
            label={moreLabel}
            {...shared}
            sections={[{ id: "more", title: moreLabel, isTitleHidden: true, items: overflow }]}
            {...omitUndefined({ onAction })}
          />
        )}
      </Toolbar>
    </div>
  );
}
