/**
 * Stackra file contract:
 * Purpose: draws one queued toast on web from HeroUI v3's Toast parts: the tone's icon (or the caller's, or none),
 *          the message, the description, the action and a dismiss button named by the provider, with the tone's
 *          live-region attributes on the text.
 * Boundary: internal, not in the `react` barrel; `ToastProvider` renders it for each toast in the queue. React Aria
 *           gives the text `role="alert"` for every toast; this overrides it so only warning and danger interrupt
 *           (a polite status written together with its container is read less reliably by some screen readers than
 *           an alert, which is the price of not interrupting for good news). HeroUI shows the dismiss button 20 px
 *           wide and only while the pointer is over the toast, so a keyboard or touch user cannot see it and the target
 *           is below WCAG 2.5.8: it is drawn 24 px and always visible on the toast in front (and on every toast while
 *           the stack is expanded).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 3); WCAG 2.2 SC 2.5.8, 4.1.3 and 2.1.1.
 */
import { Toast as HeroToast } from "@heroui/react";
import type { ReactElement } from "react";

import { liveRegionOf } from "#core/functions/live-region-of.function";
import { FeedbackIcon } from "#react/feedback-icon/feedback-icon";
import type { ToastItemProps } from "#react/toast/toast-item.props";

/**
 * The dismiss button's size and visibility: 24 px, and shown whenever the toast is in front or the stack is open. The
 * toasts folded behind the front one keep HeroUI's hidden button, so a peek of the stack stays clean. Tailwind's
 * `in-data-*` variants read the toast's own `data-frontmost` and `data-expanded` attributes.
 */
const DISMISS_CLASS_NAME =
  "size-6 in-data-[frontmost=true]:pointer-events-auto in-data-[frontmost=true]:opacity-100 in-data-[expanded=true]:pointer-events-auto in-data-[expanded=true]:opacity-100";

/** One toast: icon, message, description, action and dismiss button, announced by its tone. */
export function ToastItem({ toast, dismissLabel }: ToastItemProps): ReactElement {
  const { title, description, indicator, variant = "default", actionProps } = toast.content;
  return (
    <HeroToast toast={toast} variant={variant}>
      {indicator === null ? null : (
        <HeroToast.Indicator variant={variant}>
          {indicator ?? <FeedbackIcon tone={variant} />}
        </HeroToast.Indicator>
      )}
      <HeroToast.Content {...liveRegionOf(variant)} aria-atomic>
        <HeroToast.Title>{title}</HeroToast.Title>
        {description ? <HeroToast.Description>{description}</HeroToast.Description> : null}
      </HeroToast.Content>
      {actionProps?.children ? <HeroToast.ActionButton {...actionProps} /> : null}
      <HeroToast.CloseButton aria-label={dismissLabel} className={DISMISS_CLASS_NAME} />
    </HeroToast>
  );
}
