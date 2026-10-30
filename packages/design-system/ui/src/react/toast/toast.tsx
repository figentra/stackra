/**
 * Stackra file contract:
 * Purpose: the web `toast()`: the imperative call that shows a transient message from anywhere in the app, on HeroUI
 *          v3's toast queue. It takes the message and `ToastContractProps` (tone, icon, description, one action,
 *          timeout, onClose, and the person's `avatar`, drawn in place of the icon), returns the toast's id, and has `success`, `warning`, `danger` and `info` for the tones,
 *          `close(id)` and `clear()`. A toast with an action stays 8000 ms by default, not 4000. `toast.promise(work,
 *          messages)` shows one toast with a spinner that turns into the success or the failure message in place, and
 *          `toast.undo(message, { onUndo })` one with "Undo" and a ring that empties until the change is kept.
 * Boundary: shows nothing by itself: a `ToastProvider` must be mounted, and a toast called earlier waits in the queue
 *           until it is. Pressing the action runs it and then closes the toast. `info` is the `accent` tone. A promise
 *           toast stays until the work settles, then 4000 ms; a rejection is caught here and only shown. An undo
 *           toast's `onCommit` runs when it closes without an undo. Not carried over from HeroUI: `toast.update`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 4.1.3 and
 *          2.2.1.
 */
import { toast as heroToast } from "@heroui/react";

import type { ToastContractProps } from "#contracts/types/toast-contract-props.type";
import type { ToastPromiseMessages } from "#contracts/types/toast-promise-messages.type";
import type { ToastUndoOptions } from "#contracts/types/toast-undo-options.type";
import { TOAST_ACTION_TIMEOUT } from "#core/constants/toast-action-timeout.constant";
import { TOAST_TIMEOUT } from "#core/constants/toast-timeout.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Avatar } from "#react/avatar/avatar";
import { FeedbackIcon } from "#react/feedback-icon/feedback-icon";
import { UndoCountdown } from "#react/toast/undo-countdown";
import { UndoLabel } from "#react/toast/undo-label";

/** The options of the tone shortcuts: everything but the tone, which the shortcut sets. */
type ToneShortcutOptions = Omit<ToastContractProps, "tone">;

/**
 * Shows a toast.
 * @param message - the message, in the app's language
 * @param options - the tone, icon, description, action, timeout and close callback
 * @returns the id of the toast, for `toast.close`
 */
function show(message: string, options: ToastContractProps = {}): string {
  const { tone = "default", icon, avatar, description, action, onClose } = options;
  // An action needs time to be reached, so it lengthens the default; the caller's own timeout, 0 included, wins.
  const timeout = options.timeout ?? (action === undefined ? undefined : TOAST_ACTION_TIMEOUT);
  const id: string = heroToast(
    message,
    omitUndefined({
      variant: tone,
      description,
      timeout,
      onClose,
      // `null` removes the indicator, `undefined` leaves the tone's own icon to the provider.
      indicator: avatar ? (
        <Avatar name={avatar.name} size="sm" {...omitUndefined({ src: avatar.src })} />
      ) : icon === false ? null : icon === undefined ? undefined : (
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
  /**
   * Shows one toast for some work: a spinner and `loading` while it runs, then `success` or `error` in place.
   * @returns the toast's id
   */
  promise: <T,>(
    work: Promise<T> | (() => Promise<T>),
    messages: ToastPromiseMessages<T>,
  ): string => {
    const id: string = heroToast(messages.loading, { isLoading: true, timeout: 0 });
    const settle = (tone: "success" | "danger", message: string) => {
      heroToast.update(
        id,
        message,
        omitUndefined({
          variant: tone,
          description: messages.description,
          isLoading: false,
          timeout: TOAST_TIMEOUT,
        }),
      );
    };
    // Started inside a promise, so a function that throws at once is shown as a failure too.
    void Promise.resolve()
      .then(() => (typeof work === "function" ? work() : work))
      .then(
        (value) =>
          settle(
            "success",
            typeof messages.success === "function" ? messages.success(value) : messages.success,
          ),
        (error: unknown) =>
          settle(
            "danger",
            typeof messages.error === "function" ? messages.error(error) : messages.error,
          ),
      );
    return id;
  },
  /**
   * Shows a change with "Undo" and a countdown ring; `onCommit` runs if it closes without an undo.
   * @returns the toast's id
   */
  undo: (message: string, options: ToastUndoOptions): string => {
    const { onUndo, onCommit, undoLabel, description } = options;
    const timeout = options.timeout ?? TOAST_ACTION_TIMEOUT;
    let isUndone = false;
    const id: string = heroToast(
      message,
      omitUndefined({
        description,
        timeout,
        onClose: () => {
          if (!isUndone) onCommit?.();
        },
        indicator: <UndoCountdown duration={timeout} />,
        actionProps: {
          children: undoLabel ?? <UndoLabel />,
          onPress: () => {
            isUndone = true;
            onUndo();
            heroToast.close(id);
          },
        },
      }),
    );
    return id;
  },
  /** Closes one toast by the id `toast()` returned. */
  close: (id: string): void => {
    heroToast.close(id);
  },
  /** Closes every toast. */
  clear: (): void => {
    heroToast.clear();
  },
});
