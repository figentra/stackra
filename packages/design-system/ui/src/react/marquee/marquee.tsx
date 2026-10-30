/**
 * Stackra file contract:
 * Purpose: the web `Marquee`: a strip whose content scrolls on a seamless loop (two copies on a track moved by the
 *          Web Animations API), toward the reading start: leftward in English, rightward in Arabic. It stops while
 *          the pointer or focus is inside and with its pause button; the edges fade out.
 * Boundary: a group named by `label`; the second copy is hidden from screen readers and inert, so each link is reached
 *           once. Under reduced motion nothing moves: one copy, wrapped onto lines, and no pause button (WCAG 2.2.2).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.2.2 and 2.3.3; STA-1371
 *          (wave D, owner approval 2026-10-30).
 */
import { cn } from "@heroui/react";
import { Pause, Play } from "@stackra/icons/react/lucide-icons";
import { useReducedMotion } from "motion/react";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { useLocale } from "react-aria-components";

import { LONG_TAIL_KEYS } from "#core/constants/long-tail-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import type { MarqueeProps } from "#react/marquee/marquee.props";

/** The marquee's words. */
const K = LONG_TAIL_KEYS.ui.marquee;

/** One copy of the content; the trailing padding is the seam between copies. */
const COPY = "flex shrink-0 items-center gap-8 pe-8";

/** A strip whose content scrolls in a seamless loop, with a button to pause it. */
export function Marquee({ children, label, speed = 40, className }: MarqueeProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const isRtl = useLocale().direction === "rtl";
  const track = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const isStopped = isPaused || isHeld;
  const isStoppedNow = useRef(isStopped);

  // Runs before the effect below, so a restarted loop starts paused when it should.
  useEffect(() => {
    isStoppedNow.current = isStopped;
    if (isStopped) animation.current?.pause();
    else animation.current?.play();
  }, [isStopped]);

  useEffect(() => {
    const element = track.current;
    if (isReduced || !element || typeof element.animate !== "function") return;
    // Half the track is one copy; moving by it lands exactly where the loop began.
    const durationOf = () => Math.max(1, (element.scrollWidth / 2 / speed) * 1000);
    const moving = element.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(${isRtl ? 50 : -50}%)` }],
      { duration: durationOf(), iterations: Infinity },
    );
    if (isStoppedNow.current) moving.pause();
    animation.current = moving;
    // New or resized content keeps the same speed.
    const observer =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => moving.effect?.updateTiming({ duration: durationOf() }))
        : null;
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      moving.cancel();
      animation.current = null;
    };
  }, [isReduced, isRtl, speed]);

  if (isReduced) {
    return (
      <div
        role="group"
        aria-label={label}
        data-slot="marquee"
        className={cn("flex flex-wrap items-center gap-x-8 gap-y-3", className)}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="marquee"
      className={cn("flex w-full min-w-0 items-center gap-2", className)}
    >
      <div
        className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)]"
        onPointerEnter={() => setIsHeld(true)}
        onPointerLeave={() => setIsHeld(false)}
        onFocus={() => setIsHeld(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsHeld(false);
        }}
      >
        <div ref={track} data-slot="marquee-track" className="flex w-max">
          <div className={COPY}>{children}</div>
          <div className={COPY} aria-hidden="true" inert>
            {children}
          </div>
        </div>
      </div>
      <IconButton
        icon={isPaused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
        label={t(isPaused ? K.play : K.pause)}
        variant="ghost"
        size="sm"
        onPress={() => setIsPaused((paused) => !paused)}
      />
    </div>
  );
}
