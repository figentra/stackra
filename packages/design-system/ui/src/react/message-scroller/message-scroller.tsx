/**
 * Stackra file contract:
 * Purpose: the web `MessageScroller`: the scrolling region of a chat. While the person is at the bottom it follows new
 *          content as it arrives (a streamed answer included); once they scroll up it stays where they read, and a
 *          "New messages" button (with how many arrived) appears when more arrives and takes them back
 *          down. The count is of the children added since they left, so each message is one child.
 * Boundary: a `role="log"` region with polite announcements, focusable so the keyboard can scroll it. A ResizeObserver
 *           on the content notices growth (none in very old browsers: the region then just scrolls). The jump is smooth,
 *           and instant under reduced motion; following stays instant so it never lags a stream.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1, 2.3.3, 4.1.3; STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import { cn } from "@heroui/react";
import { useReducedMotion } from "motion/react";
import { Children, useEffect, useRef, useState, type ReactElement } from "react";

import { AI_CHAT_KEYS } from "#core/constants/ai-chat-keys.constant";
import { isNearBottom } from "#core/functions/is-near-bottom.function";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import type { MessageScrollerProps } from "#react/message-scroller/message-scroller.props";

/** The scroller's words. */
const K = AI_CHAT_KEYS.ui.message_scroller;

/** A chat's scrolling region that sticks to the newest message. */
export function MessageScroller({
  children,
  label,
  className,
}: MessageScrollerProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const region = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const isSticking = useRef(true);
  const lastTop = useRef(0);
  const [hasNew, setHasNew] = useState(false);
  const count = Children.count(children);
  // How many messages there were when the person scrolled up; null while they are at the bottom.
  const [countWhenLeft, setCountWhenLeft] = useState<number | null>(null);
  const newCount = countWhenLeft === null ? 0 : Math.max(0, count - countWhenLeft);

  // Follow growth while sticking; otherwise note that something new is below.
  useEffect(() => {
    const box = region.current;
    if (!box || !content.current || typeof ResizeObserver === "undefined") return;
    box.scrollTop = box.scrollHeight;
    const observer = new ResizeObserver(() => {
      if (isSticking.current) box.scrollTop = box.scrollHeight;
      else setHasNew(true);
    });
    observer.observe(content.current);
    return () => observer.disconnect();
  }, []);

  const onScroll = () => {
    const box = region.current;
    if (!box) return;
    if (isNearBottom(box.scrollTop, box.scrollHeight, box.clientHeight)) {
      isSticking.current = true;
      setCountWhenLeft(null);
      setHasNew(false);
    } else if (box.scrollTop < lastTop.current - 1) {
      // Only the person scrolling up stops the sticking; content growing below never does.
      isSticking.current = false;
      setCountWhenLeft((left) => left ?? count);
    }
    lastTop.current = box.scrollTop;
  };

  const jump = () => {
    const box = region.current;
    if (!box) return;
    isSticking.current = true;
    setHasNew(false);
    setCountWhenLeft(null);
    box.scrollTo({ top: box.scrollHeight, behavior: isReduced ? "auto" : "smooth" });
  };

  const isJumpShown = hasNew || newCount > 0;
  return (
    // Clipped: the log's scrolled-off lines then end at the frame, the ground they are read (and measured) on.
    <div className={cn("relative flex min-h-0 flex-col overflow-hidden", className) ?? ""}>
      <div
        ref={region}
        role="log"
        aria-live="polite"
        aria-label={label ?? t(K.label)}
        // A scrolling region the keyboard can reach and scroll (axe scrollable-region-focusable).
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- reason: a scrollable log must be focusable to scroll by keyboard
        tabIndex={0}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:[outline-style:var(--focus-ring-style)] focus-visible:outline-(length:--focus-ring-width) focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        <div ref={content}>{children}</div>
      </div>
      {isJumpShown ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <Button
            size="sm"
            variant="secondary"
            endIcon="chevron-down"
            onPress={jump}
            className="pointer-events-auto shadow-overlay"
          >
            {newCount ? t(K.new_messages_count, { count: newCount }) : t(K.new_messages)}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
