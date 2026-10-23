/**
 * Stackra file contract:
 * Purpose: the props of a toast on every runtime: what `toast(message, options)` takes (a tone and icon, a
 *          description, one action, how long it stays, a close callback) and what `ToastProvider` takes (the
 *          accessible name of the dismiss button and the screen edge). HeroUI names the tone `variant`, the edge
 *          `placement` and its native timeout `duration`; the contract keeps `tone`, `position` and `timeout`.
 * Boundary: types only. The message and description are plain strings so one call reads the same on web and native;
 *           the dismiss button's name is the provider's, because a toast is created far from any component.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 4.1.3
 *          and 2.2.1.
 */
import type { ToastPosition } from "#contracts/enums/toast-position.enum";
import type { FeedbackContractProps } from "#contracts/types/feedback-contract-props.type";

/** The one action a toast can carry, such as "Undo"; pressing it runs `onPress` and then dismisses the toast. */
export interface ToastAction {
  /** The button's text in the app's language. */
  readonly label: string;
  /** Called when the action is pressed, by pointer, touch or keyboard. */
  readonly onPress: () => void;
}

/** The options of one toast, as the second argument of `toast(message, options)`. */
export interface ToastContractProps extends FeedbackContractProps {
  /** A second line under the message. */
  readonly description?: string | undefined;
  /** One action beside the message. A toast with an action should stay long enough to reach it: see `timeout`. */
  readonly action?: ToastAction | undefined;
  /** How long the toast stays, in milliseconds. 0 keeps it until it is dismissed. Defaults to 4000. */
  readonly timeout?: number | undefined;
  /** Called when the toast closes, whether it timed out, was dismissed or was closed from code. */
  readonly onClose?: (() => void) | undefined;
}

/** The props of `ToastProvider`, which mounts the toast region once near the root of the app. */
export interface ToastProviderContractProps {
  /** The accessible name of every toast's dismiss button in the app's language, for example "Dismiss notification". */
  readonly dismissLabel: string;
  /** The screen edge toasts appear against, centred. Defaults to `bottom`. */
  readonly position?: ToastPosition | undefined;
}
