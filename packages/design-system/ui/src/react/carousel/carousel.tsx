/**
 * Stackra file contract:
 * Purpose: the web `Carousel`: a scroll-snapping row of full-width slides that people swipe, scroll or step with the
 *          previous and next buttons and the page dots; a region with the carousel role description, each slide a
 *          group named "Slide 2 of 5". With `thumbnails`, a strip of small pictures to press replaces the dots.
 * Boundary: native scrolling does the motion (smooth only without reduced motion); it never auto-advances, so there
 *           is nothing to pause (WCAG 2.2.2). The row follows the page direction: Arabic starts at the right.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.1.1 and 2.2.2; STA-1371.
 */
import { cn } from "@heroui/react";
import { useReducedMotion } from "motion/react";
import { Children, type ReactElement, useRef, useState } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import type { CarouselProps } from "#react/carousel/carousel.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { PageIndicator } from "#react/page-indicator/page-indicator";

/** K: the carousel's words. */
const K = UI_KEYS.ui.carousel;

/** Slides that snap. */
export function Carousel({
  children,
  label,
  showDots = true,
  showArrows = true,
  thumbnails,
  onIndexChange,
  className,
}: CarouselProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const viewport = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = children.length;
  const goTo = (next: number) => {
    const slide = viewport.current?.children[Math.max(0, Math.min(count - 1, next))];
    slide?.scrollIntoView({
      behavior: isReduced ? "auto" : "smooth",
      inline: "start",
      block: "nearest",
    });
  };
  const onScroll = () => {
    const element = viewport.current;
    if (!element || element.clientWidth === 0) return;
    // scrollLeft runs negative in right-to-left, so its size is the distance from the start either way.
    const next = Math.round(Math.abs(element.scrollLeft) / element.clientWidth);
    if (next !== index) {
      setIndex(next);
      onIndexChange?.(next);
    }
  };
  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      data-slot="carousel"
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
    >
      <div
        ref={viewport}
        onScroll={onScroll}
        // Focusable, so a keyboard user can scroll the slides with the arrow keys (WCAG 2.1.1, axe scrollable-region-focusable).
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- reason: a scroll region must take focus so a keyboard user can scroll it (WCAG 2.1.1)
        tabIndex={0}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[var(--radius-container)] outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-focus"
      >
        {Children.map(children, (slide, position) => (
          <div
            role="group"
            aria-roledescription="slide"
            aria-label={t(K.slide, { index: position + 1, count })}
            className="w-full shrink-0 snap-start"
          >
            {slide}
          </div>
        ))}
      </div>
      {showArrows || showDots || thumbnails?.length ? (
        <div className="flex items-center justify-between gap-2">
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
            <span />
          )}
          {thumbnails?.length ? (
            <div
              role="group"
              aria-label={t(K.pages)}
              data-slot="carousel-thumbnails"
              className="flex min-w-0 items-center gap-2 overflow-x-auto p-1 [scrollbar-width:none]"
            >
              {Children.map(children, (_, position) => (
                <button
                  type="button"
                  aria-label={t(K.slide, { index: position + 1, count })}
                  aria-current={position === index ? "true" : undefined}
                  onClick={() => goTo(position)}
                  className={cn(
                    "size-14 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-default outline-none focus-visible:ring-2 focus-visible:ring-focus",
                    position === index ? "ring-2 ring-accent" : "opacity-60 hover:opacity-100",
                  )}
                >
                  {thumbnails[position] ? (
                    <img
                      src={thumbnails[position]}
                      alt=""
                      className="block size-full object-cover"
                    />
                  ) : null}
                </button>
              ))}
            </div>
          ) : showDots ? (
            <PageIndicator
              count={count}
              index={index}
              onChange={goTo}
              label={t(K.pages)}
              getPageLabel={(page, total) => t(K.slide, { index: page, count: total })}
            />
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
            <span />
          )}
        </div>
      ) : null}
    </section>
  );
}
