/**
 * Stackra file contract:
 * Purpose: the web `FloatingPanel`: a non-modal window over the page (a chat, a tool palette) with a header holding a
 *          move handle, the title, minimise and close. People drag it by the header and resize it from the grip in its
 *          bottom inline-end corner; by keyboard the move handle and the grip are buttons whose arrow keys move or
 *          resize it (10 px, 50 px with Shift). Minimise folds it to its header; Escape inside it closes it and focus
 *          goes back to where it was when the panel opened. It never leaves the viewport, also when the window shrinks.
 * Boundary: position is physical, because it is a window on a screen: the arrow keys and the pointer move it the way
 *           they point in both directions. It opens at the bottom inline-end corner (bottom right, bottom left in
 *           right-to-left), and the grip sits at the inline-end corner, so resizing in right-to-left grows it to the
 *           left. It is `position: fixed` and not portalled, so a transformed ancestor (a preview card) contains it.
 *           Non-modal: the page behind stays usable and focus is not trapped. No motion of its own.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WAI-ARIA dialog (non-modal); WCAG 2.2 SC 2.1.1, 2.4.3, 2.5.7 and 4.1.2;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { cn } from "@heroui/react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
} from "react";
import { useLocale, VisuallyHidden } from "react-aria-components";

import { OVERLAY_SELECTION_KEYS } from "#core/constants/overlay-selection-keys.constant";
import { clampPanelRect } from "#core/functions/clamp-panel-rect.function";
import type { FloatingPanelProps } from "#react/floating-panel/floating-panel.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";

/** The panel's words. */
const K = OVERLAY_SELECTION_KEYS.ui.floating_panel;

/** The gap to the viewport's edges where the panel first opens, in pixels. */
const MARGIN = 16;

/** One arrow key's move or resize, and one with Shift, in pixels. */
const STEP = 10;
const LARGE_STEP = 50;

/** The panel's box in pixels. */
type Rect = ReturnType<typeof clampPanelRect>;

/** The viewport's size now. */
const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

/** The arrow keys as a physical move. */
const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** A movable, resizable, non-modal panel over the page. */
export function FloatingPanel({
  title,
  children,
  isOpen,
  defaultOpen = true,
  onOpenChange,
  defaultWidth = 360,
  defaultHeight = 420,
  minWidth = 240,
  minHeight = 160,
  className,
}: FloatingPanelProps): ReactElement | null {
  const t = useUiText();
  const id = useId();
  const isRtl = useLocale().direction === "rtl";
  const [own, setOwn] = useState(defaultOpen);
  const open = isOpen ?? own;
  const [isMinimised, setMinimised] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const panel = useRef<HTMLElement | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const drag = useRef<{ x: number; y: number; rect: Rect; mode: "move" | "resize" } | null>(null);

  const place = (next: Rect) =>
    setRect(
      clampPanelRect(next, viewport(), isMinimised ? panel.current?.offsetHeight : next.height),
    );
  /** `from` resized by a physical pointer or key move; in right-to-left the grip is on the left edge. */
  const resized = (from: Rect, dx: number, dy: number): Rect => {
    const width = Math.max(minWidth, from.width + (isRtl ? -dx : dx));
    return {
      ...from,
      width,
      height: Math.max(minHeight, from.height + dy),
      x: isRtl ? from.x + from.width - width : from.x,
    };
  };

  useLayoutEffect(() => {
    if (!open) return;
    if (document.activeElement instanceof HTMLElement) returnTo.current = document.activeElement;
    setRect((current) => {
      if (current !== null) return clampPanelRect(current, viewport());
      const width = Math.min(defaultWidth, window.innerWidth - 2 * MARGIN);
      const height = Math.min(defaultHeight, window.innerHeight - 2 * MARGIN);
      return {
        width,
        height,
        x: isRtl ? MARGIN : window.innerWidth - width - MARGIN,
        y: window.innerHeight - height - MARGIN,
      };
    });
    // Placed once per opening; later moves and resizes are the person's.
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reruns only when the panel opens
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => setRect((current) => current && clampPanelRect(current, viewport()));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  if (!open || rect === null) return null;

  const close = () => {
    if (isOpen === undefined) setOwn(false);
    onOpenChange?.(false);
    returnTo.current?.focus();
  };
  const start = (mode: "move" | "resize") => (event: PointerEvent<HTMLElement>) => {
    // A press on a header button is that button's.
    if (event.button !== 0 || (mode === "move" && (event.target as HTMLElement).closest("button")))
      return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, rect, mode };
  };
  const follow = (event: PointerEvent<HTMLElement>) => {
    const from = drag.current;
    if (from === null) return;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    place(
      from.mode === "move"
        ? { ...from.rect, x: from.rect.x + dx, y: from.rect.y + dy }
        : resized(from.rect, dx, dy),
    );
  };
  const stop = () => {
    drag.current = null;
  };
  const pointer = (mode: "move" | "resize") => ({
    onPointerDown: start(mode),
    onPointerMove: follow,
    onPointerUp: stop,
    onPointerCancel: stop,
  });
  const keys = (mode: "move" | "resize") => (event: KeyboardEvent<HTMLElement>) => {
    const arrow = ARROWS[event.key];
    if (arrow === undefined) return;
    event.preventDefault();
    const step = event.shiftKey ? LARGE_STEP : STEP;
    const [dx, dy] = [arrow[0] * step, arrow[1] * step];
    place(mode === "move" ? { ...rect, x: rect.x + dx, y: rect.y + dy } : resized(rect, dx, dy));
  };

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape closes a dialog (WAI-ARIA dialog pattern); the keys come from the controls inside
    <section
      ref={panel}
      role="dialog"
      aria-labelledby={`${id}-title`}
      data-slot="floating-panel"
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        close();
      }}
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden border border-separator bg-overlay text-foreground shadow-overlay",
        className,
      )}
      style={{
        borderRadius: "var(--radius-container)",
        left: rect.x,
        top: rect.y,
        width: rect.width,
        ...(isMinimised ? {} : { height: rect.height }),
      }}
    >
      <div
        {...pointer("move")}
        className={cn(
          "flex cursor-move touch-none items-center gap-1 py-1 ps-1 pe-1 select-none",
          !isMinimised && "border-b border-separator",
        )}
      >
        <button
          type="button"
          aria-label={t(K.move)}
          aria-describedby={`${id}-move-hint`}
          onKeyDown={keys("move")}
          style={{ borderRadius: "var(--radius-control)" }}
          className="flex size-8 shrink-0 cursor-move items-center justify-center text-muted outline-none hover:bg-default focus-visible:outline-2 focus-visible:outline-focus"
        >
          <Icon name="grip-vertical" size="sm" />
        </button>
        <h2 id={`${id}-title`} className="min-w-0 flex-1 truncate text-sm font-semibold">
          {title}
        </h2>
        <IconButton
          icon={isMinimised ? "maximize-2" : "minimize-2"}
          label={t(isMinimised ? K.restore : K.minimise)}
          variant="ghost"
          size="sm"
          aria-expanded={!isMinimised}
          onPress={() => {
            // Restored to full height, it must fit again.
            if (isMinimised) setRect(clampPanelRect(rect, viewport()));
            setMinimised(!isMinimised);
          }}
        />
        <IconButton icon="x" label={t(K.close)} variant="ghost" size="sm" onPress={close} />
      </div>
      <div hidden={isMinimised} className="min-h-0 flex-1 overflow-auto p-3">
        {children}
      </div>
      {isMinimised ? null : (
        <button
          type="button"
          {...pointer("resize")}
          aria-label={t(K.resize)}
          aria-describedby={`${id}-resize-hint`}
          onKeyDown={keys("resize")}
          className="absolute end-0 bottom-0 flex size-5 touch-none items-end justify-end p-1 text-muted outline-none focus-visible:outline-2 focus-visible:outline-focus ltr:cursor-nwse-resize rtl:cursor-nesw-resize"
        >
          <svg
            aria-hidden
            viewBox="0 0 10 10"
            className="size-2.5 rtl:-scale-x-100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M9 3 3 9M9 7 7 9" />
          </svg>
        </button>
      )}
      <VisuallyHidden id={`${id}-move-hint`}>{t(K.move_hint)}</VisuallyHidden>
      <VisuallyHidden id={`${id}-resize-hint`}>{t(K.resize_hint)}</VisuallyHidden>
    </section>
  );
}
