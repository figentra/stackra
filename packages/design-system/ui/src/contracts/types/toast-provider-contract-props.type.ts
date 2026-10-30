/**
 * Stackra file contract:
 * Purpose: `ToastProviderContractProps`: the props of `ToastProvider`, which mounts the toast region once near the root
 *          of the app.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 4.1.3 and 2.2.1.
 */
import type { ToastAlign } from "#contracts/enums/toast-align.enum";
import type { ToastPosition } from "#contracts/enums/toast-position.enum";
import type { ToastVariant } from "#contracts/enums/toast-variant.enum";

/** The props of `ToastProvider`, which mounts the toast region once near the root of the app. */
export interface ToastProviderContractProps {
  /** The accessible name of every toast's dismiss button in the app's language, for example "Dismiss notification". */
  readonly dismissLabel: string;
  /** The screen edge toasts appear against. Defaults to `bottom`. */
  readonly position?: ToastPosition | undefined;
  /** Where along that edge: the inline `start`, the `center`, the inline `end` or `full` width. Defaults to `center`. */
  readonly align?: ToastAlign | undefined;
  /** The look of every toast: `alert`, `bar`, `flip-bar` or `bubble`. Defaults to `alert`. */
  readonly variant?: ToastVariant | undefined;
}
