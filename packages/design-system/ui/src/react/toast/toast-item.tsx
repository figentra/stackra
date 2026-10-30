/**
 * Stackra file contract:
 * Purpose: draws one queued toast on web from HeroUI v3's Toast parts, as a grid of four columns: the tone's icon (or
 *          the caller's, the person's avatar, or none) at the start; the message with its description on the next
 *          line; the optional action; and the dismiss button, a ghost 24 px icon button in its own column at the end of
 *          the title row, so text never runs under it. The card is the overlay surface with a soft shadow and the
 *          container radius; the tone colours only the icon (and, in the `bar` looks, a thin start-edge accent), the
 *          text stays foreground. Looks: the `alert` card, a `bar` with the start-edge accent, the bar flipping in
 *          (`flip-bar`), or a round `bubble`. It enters from the reading-start edge, so from the right in Arabic. A
 *          pointer drag sideways past 80 px swipes the toast away.
 * Boundary: internal, not in the `react` barrel; `ToastProvider` renders it for each toast in the queue. React Aria
 *           gives the text `role="alert"` for every toast; this overrides it so only warning and danger interrupt
 *           (a polite status written together with its container is read less reliably by some screen readers than
 *           an alert, which is the price of not interrupting for good news). HeroUI puts the dismiss button 20 px wide
 *           outside the card's corner and only while the pointer is over it: it is drawn inside, 24 px, and always
 *           visible on the toast in front (and on every toast while the stack is expanded). HeroUI keeps the stack:
 *           toasts overlap, fan out on hover or focus, newest in front, and its region pauses the timers meanwhile. The swipe moves the toast with the CSS `translate` property, which HeroUI's own
 *           `transform` stack motion leaves free; the dismiss button stays the keyboard's way out. The flip plays only
 *           at the `full` motion level, on the `rotate` property for the same reason.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 3); ADR 0329 (motion layer); WCAG 2.2 SC 2.5.7,
 *          2.5.8, 4.1.3 and 2.1.1.
 */
import type { Tone } from "@stackra/contracts";
import { Toast as HeroToast, toast as heroToast } from "@heroui/react";
import { useEffect, useRef, type ReactElement } from "react";

import type { ToastVariant } from "#contracts/enums/toast-variant.enum";
import { liveRegionOf } from "#core/functions/live-region-of.function";
import { useMotion } from "#react/design-system-provider/use-motion";
import { FeedbackIcon } from "#react/feedback-icon/feedback-icon";
import type { ToastItemProps } from "#react/toast/toast-item.props";

/**
 * The dismiss button's size and visibility: 24 px, and shown whenever the toast is in front or the stack is open. The
 * toasts folded behind the front one keep HeroUI's hidden button, so a peek of the stack stays clean. Tailwind's
 * `in-data-*` variants read the toast's own `data-frontmost` and `data-expanded` attributes.
 */
const DISMISS_CLASS_NAME =
  "static col-end-[-1] row-start-1 size-6 self-start border-0 bg-transparent text-muted hover:bg-default hover:text-foreground sm:border-0 sm:bg-transparent in-data-[frontmost=true]:pointer-events-auto in-data-[frontmost=true]:opacity-100 in-data-[expanded=true]:pointer-events-auto in-data-[expanded=true]:opacity-100";

/** The card every look shares: a grid of icon, text, action and dismiss, on the overlay surface. */
const CARD_CLASS_NAME =
  "grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-start gap-x-3 bg-overlay py-3 ps-3 pe-2 text-overlay-foreground shadow-overlay";

/** The entrance from the reading-start edge instead of HeroUI's vertical drop; `translate` is free of its transform. */
const ENTER_CLASS_NAME =
  "[transition-property:transform,height,opacity,translate] data-[entering=true]:[--toast-enter:0%] data-[entering=true]:-translate-x-8 data-[entering=true]:opacity-0 rtl:data-[entering=true]:translate-x-8";

/** The entrance under reduced motion: a fade in place, no slide and no drop (ADR 0329). */
const FADE_CLASS_NAME =
  "[transition-property:opacity] data-[entering=true]:[--toast-enter:0%] data-[entering=true]:opacity-0";

/** The tone's colour on the icon only. */
const ICON_TONE: Readonly<Record<Tone, string>> = {
  default: "text-muted",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/** How far a sideways drag must go, in CSS pixels, to dismiss the toast. */
const SWIPE_DISMISS_PX = 80;

/** The tone on the inline-start edge of a bar. */
const BAR_EDGE: Readonly<Record<Tone, string>> = {
  default: "border-s-border",
  accent: "border-s-accent",
  success: "border-s-success",
  warning: "border-s-warning",
  danger: "border-s-danger",
};

/**
 * The flip of a `flip-bar`: the bar starts turned away about its top edge while HeroUI marks it entering, and turns
 * flat on the `rotate` property, added to HeroUI's own transitioned properties.
 */
const FLIP_CLASS_NAME =
  "origin-top [transition-property:transform,height,opacity,rotate] data-[entering=true]:[rotate:x_-90deg]";

/** The classes of one look, given its tone and whether the flip plays. */
function lookClassName(variant: ToastVariant, tone: Tone, isFlipping: boolean): string {
  if (variant === "bubble") return "items-center rounded-[var(--radius-pill)] py-2 ps-2 pe-2";
  if (variant === "alert") return "rounded-[var(--radius-container)]";
  const bar = `rounded-[var(--radius-container)] border-s-2 ${BAR_EDGE[tone]}`;
  return variant === "flip-bar" && isFlipping ? `${bar} ${FLIP_CLASS_NAME}` : bar;
}

/** One toast: icon, message, description, action and dismiss button, announced by its tone. */
export function ToastItem({
  toast,
  dismissLabel,
  variant = "alert",
}: ToastItemProps): ReactElement {
  const { title, description, indicator, variant: tone = "default", actionProps } = toast.content;
  const motion = useMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    let startX: number | undefined;
    let offset = 0;
    const reset = () => {
      element.style.translate = "";
      element.style.opacity = "";
    };
    const onDown = (event: PointerEvent) => {
      // A press on the action or the dismiss button is a press, not the start of a swipe.
      if (event.target instanceof Element && event.target.closest("button")) return;
      startX = event.clientX;
      offset = 0;
    };
    const onMove = (event: PointerEvent) => {
      if (startX === undefined) return;
      offset = event.clientX - startX;
      element.style.translate = `${offset}px 0`;
      element.style.opacity = String(1 - Math.min(1, Math.abs(offset) / (SWIPE_DISMISS_PX * 2)));
    };
    const onUp = () => {
      if (startX === undefined) return;
      startX = undefined;
      if (Math.abs(offset) >= SWIPE_DISMISS_PX) heroToast.close(toast.key);
      else reset();
    };
    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onUp);
    return () => {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
    };
  }, [toast.key]);
  return (
    <HeroToast
      ref={ref}
      toast={toast}
      variant={tone}
      data-look={variant}
      className={`touch-pan-y ${CARD_CLASS_NAME} ${motion === "full" ? ENTER_CLASS_NAME : motion === "none" ? "" : FADE_CLASS_NAME} ${lookClassName(variant, tone, motion === "full")}`}
    >
      {indicator === null ? null : (
        <HeroToast.Indicator variant={tone} className={`p-0.5 ${ICON_TONE[tone]}`}>
          {indicator ?? <FeedbackIcon tone={tone} />}
        </HeroToast.Indicator>
      )}
      <HeroToast.Content
        {...liveRegionOf(tone)}
        aria-atomic
        className={`gap-0.5 self-start ${indicator === null ? "col-span-2" : ""}`}
      >
        <HeroToast.Title className="text-overlay-foreground">{title}</HeroToast.Title>
        {description ? <HeroToast.Description>{description}</HeroToast.Description> : null}
      </HeroToast.Content>
      {actionProps?.children ? (
        <HeroToast.ActionButton {...actionProps} className="mt-0 self-center sm:mt-0" />
      ) : null}
      <HeroToast.CloseButton aria-label={dismissLabel} className={DISMISS_CLASS_NAME} />
    </HeroToast>
  );
}
