/**
 * Stackra file contract:
 * Purpose: the native `toast()`: the imperative call that shows a transient message from anywhere in the app, through
 *          HeroUI Native's toast manager. It takes the message and `ToastContractProps` (tone, icon, description, one
 *          action, timeout, onClose), returns the toast's id, and has `success`, `warning`, `danger` and `info` for the
 *          tones, `close(id)` and `clear()`: the same call as on web. A toast with an action stays 8000 ms by default, not 4000.
 *          `toast.promise(work, messages)` shows a spinner that turns into the success or failure message in place
 *          (shown again under the same id, which HeroUI Native replaces), and `toast.undo(message, { onUndo })` shows
 *          "Undo" with the seconds left counting down.
 * Boundary: shows nothing by itself: a `ToastProvider` must be mounted, and a toast called earlier waits until it is.
 *           HeroUI Native has no imperative function, only a hook, so the call goes through `toastBridge`. A timeout of
 *           0 is HeroUI Native's `persistent`. Pressing the action runs it and then closes the toast. `info` is the
 *           `accent` tone. A toast can also be swiped away (HeroUI Native's gesture); the dismiss button is the
 *           alternative for assistive technology. A promise toast stays until the work settles, then 4000 ms; a
 *           rejection is caught here and only shown. An undo toast's word is the catalogue's "Undo" unless `undoLabel`
 *           is given, and its `onCommit` runs when it closes without an undo. Not carried over from HeroUI:
 *           `toast.update`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 4.1.3 and
 *          2.2.1; STA-1371 (promise and undo toasts, owner request 2026-10-29).
 */
import type { ToastContractProps } from "#contracts/types/toast-contract-props.type";
import type { ToastPromiseMessages } from "#contracts/types/toast-promise-messages.type";
import type { ToastUndoOptions } from "#contracts/types/toast-undo-options.type";
import { TOAST_ACTION_TIMEOUT } from "#core/constants/toast-action-timeout.constant";
import { TOAST_TIMEOUT } from "#core/constants/toast-timeout.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { toastBridge } from "#native/toast/toast-bridge";
import { ToastItem } from "#native/toast/toast-item";

/** The options of the tone shortcuts: everything but the tone, which the shortcut sets. */
type ToneShortcutOptions = Omit<ToastContractProps, "tone">;

/** What `present` draws beyond the contract: a promise toast's spinner and an undo toast's countdown. */
type PresentOptions = ToastContractProps & {
  readonly isLoading?: boolean | undefined;
  readonly countdown?: number | undefined;
};

/** Counts the toasts shown, so each has an id before any provider exists to give it one. */
let shown = 0;

/** A new toast id. */
function nextId(): string {
  shown += 1;
  return `stackra-toast-${shown}`;
}

/**
 * Shows one toast, or replaces the one already shown under `id` in place.
 * @param id - the toast's id
 * @param message - the message, in the app's language
 * @param options - the tone, icon, description, action, timeout and close callback
 */
function present(id: string, message: string, options: PresentOptions = {}): void {
  const {
    tone = "default",
    icon,
    avatar,
    description,
    action,
    onClose,
    isLoading,
    countdown,
  } = options;
  // An action needs time to be reached, so it lengthens the default; the caller's own timeout, 0 included, wins.
  const timeout = options.timeout ?? (action === undefined ? undefined : TOAST_ACTION_TIMEOUT);
  toastBridge.show({
    id,
    // Read when the toast renders, which is after a provider has connected.
    component: (props) => (
      <ToastItem
        toast={props}
        tone={tone}
        title={message}
        description={description}
        icon={icon}
        avatar={avatar}
        action={action}
        isLoading={isLoading}
        countdown={countdown}
        dismissLabel={toastBridge.dismissLabel()}
        variant={toastBridge.variant()}
      />
    ),
    ...omitUndefined({
      duration: timeout === 0 ? ("persistent" as const) : timeout,
      onHide: onClose,
    }),
  });
}

/**
 * Shows a toast.
 * @param message - the message, in the app's language
 * @param options - the tone, icon, description, action, timeout and close callback
 * @returns the id of the toast, for `toast.close`
 */
function show(message: string, options: ToastContractProps = {}): string {
  const id = nextId();
  present(id, message, options);
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
    const id = nextId();
    present(id, messages.loading, { isLoading: true, timeout: 0 });
    const settle = (tone: "success" | "danger", message: string) => {
      present(id, message, { tone, description: messages.description, timeout: TOAST_TIMEOUT });
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
   * Shows a change with "Undo" and the seconds left; `onCommit` runs if it closes without an undo.
   * @returns the toast's id
   */
  undo: (message: string, options: ToastUndoOptions): string => {
    const { onUndo, onCommit, undoLabel, description } = options;
    const timeout = options.timeout ?? TOAST_ACTION_TIMEOUT;
    const id = nextId();
    let isUndone = false;
    present(id, message, {
      description,
      timeout,
      countdown: timeout,
      // An empty label is the catalogue's "Undo", read by ToastItem when it renders.
      action: {
        label: undoLabel ?? "",
        onPress: () => {
          isUndone = true;
          onUndo();
        },
      },
      onClose: () => {
        if (!isUndone) onCommit?.();
      },
    });
    return id;
  },
  /** Closes one toast by the id `toast()` returned. */
  close: (id: string): void => {
    toastBridge.hide(id);
  },
  /** Closes every toast. */
  clear: (): void => {
    toastBridge.hide("all");
  },
});
