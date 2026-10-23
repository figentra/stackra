/**
 * Stackra file contract:
 * Purpose: the web `toast()`: the imperative call that shows a transient message from anywhere in the app, on HeroUI
 *          v3's toast queue. It takes the message and `ToastContractProps` (tone, icon, description, one action,
 *          timeout, onClose), returns the toast's id, and has `success`, `warning`, `danger` and `info` for the tones,
 *          `close(id)` and `clear()`.
 * Boundary: shows nothing by itself: a `ToastProvider` must be mounted, and a toast called earlier waits in the queue
 *           until it is. Pressing the action runs it and then closes the toast. `info` is the `accent` tone. Not
 *           carried over from HeroUI: `toast.promise`, `toast.update` and a loading state, which have no native twin.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 4.1.3 and
 *          2.2.1.
 */
import { toast as heroToast } from "@heroui/react";

import type { ToastContractProps } from "#contracts/types/toast-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { FeedbackIcon } from "#react/feedback-icon/feedback-icon";

/** The options of the tone shortcuts: everything but the tone, which the shortcut sets. */
type ToneShortcutOptions = Omit<ToastContractProps, "tone">;

/**
 * Shows a toast.
 * @param message - the message, in the app's language
 * @param options - the tone, icon, description, action, timeout and close callback
 * @returns the id of the toast, for `toast.close`
 */
function show(message: string, options: ToastContractProps = {}): string {
  const { tone = "default", icon, description, action, timeout, onClose } = options;
  const id: string = heroToast(
    message,
    omitUndefined({
      variant: tone,
      description,
      timeout,
      onClose,
      // `null` removes the indicator, `undefined` leaves the tone's own icon to the provider.
      indicator:
        icon === false ? null : icon === undefined ? undefined : (
          <FeedbackIcon tone={tone} icon={icon} />
        ),
      actionProps:
        action === undefined
          ? undefined
          : {
              children: action.label,
              onPress: () => {
                action.onPress();
                heroToast.close(id);
              },
            },
    }),
  );
  return id;
}

/** The imperative toast API: call it with a message, or use a tone shortcut, from any module. */
export const toast = Object.assign(show, {
  /** Shows a success toast. */
  success: (message: string, options?: ToneShortcutOptions) =>
    show(message, { ...options, tone: "success" }),
  /** Shows a warning toast, announced at once. */
  warning: (message: string, options?: ToneShortcutOptions) =>
    show(message, { ...options, tone: "warning" }),
  /** Shows a danger toast, announced at once. */
  danger: (message: string, options?: ToneShortcutOptions) =>
    show(message, { ...options, tone: "danger" }),
  /** Shows an informational toast, the `accent` tone. */
  info: (message: string, options?: ToneShortcutOptions) =>
    show(message, { ...options, tone: "accent" }),
  /** Closes one toast by the id `toast()` returned. */
  close: (id: string): void => {
    heroToast.close(id);
  },
  /** Closes every toast. */
  clear: (): void => {
    heroToast.clear();
  },
});
