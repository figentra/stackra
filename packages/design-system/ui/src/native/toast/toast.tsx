/**
 * Stackra file contract:
 * Purpose: the native `toast()`: the imperative call that shows a transient message from anywhere in the app, through
 *          HeroUI Native's toast manager. It takes the message and `ToastContractProps` (tone, icon, description, one
 *          action, timeout, onClose), returns the toast's id, and has `success`, `warning`, `danger` and `info` for the
 *          tones, `close(id)` and `clear()`: the same call as on web. A toast with an action stays 8000 ms by default, not 4000.
 * Boundary: shows nothing by itself: a `ToastProvider` must be mounted, and a toast called earlier waits until it is.
 *           HeroUI Native has no imperative function, only a hook, so the call goes through `toastBridge`. A timeout of
 *           0 is HeroUI Native's `persistent`. Pressing the action runs it and then closes the toast. `info` is the
 *           `accent` tone. A toast can also be swiped away (HeroUI Native's gesture); the dismiss button is the
 *           alternative for assistive technology. Not carried over from HeroUI: `toast.promise` and `toast.update`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 4.1.3 and
 *          2.2.1.
 */
import type { ToastContractProps } from "#contracts/types/toast-contract-props.type";
import { TOAST_ACTION_TIMEOUT } from "#core/constants/toast-action-timeout.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { toastBridge } from "#native/toast/toast-bridge";
import { ToastItem } from "#native/toast/toast-item";

/** The options of the tone shortcuts: everything but the tone, which the shortcut sets. */
type ToneShortcutOptions = Omit<ToastContractProps, "tone">;

/** Counts the toasts shown, so each has an id before any provider exists to give it one. */
let shown = 0;

/**
 * Shows a toast.
 * @param message - the message, in the app's language
 * @param options - the tone, icon, description, action, timeout and close callback
 * @returns the id of the toast, for `toast.close`
 */
function show(message: string, options: ToastContractProps = {}): string {
  const { tone = "default", icon, description, action, onClose } = options;
  // An action needs time to be reached, so it lengthens the default; the caller's own timeout, 0 included, wins.
  const timeout = options.timeout ?? (action === undefined ? undefined : TOAST_ACTION_TIMEOUT);
  shown += 1;
  const id = `stackra-toast-${shown}`;
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
        action={action}
        dismissLabel={toastBridge.dismissLabel()}
      />
    ),
    ...omitUndefined({
      duration: timeout === 0 ? ("persistent" as const) : timeout,
      onHide: onClose,
    }),
  });
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
    toastBridge.hide(id);
  },
  /** Closes every toast. */
  clear: (): void => {
    toastBridge.hide("all");
  },
});
