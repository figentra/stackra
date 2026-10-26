/**
 * Stackra file contract:
 * Purpose: `ToastItemProps`, the props of the web `ToastItem` in `toast-item.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312 (decision
 *          3); WCAG 2.2 SC 2.5.8, 4.1.3 and 2.1.1.
 */
import type { ToastContentValue } from "@heroui/react";
import type { QueuedToast } from "react-aria-components/Toast";

/** Props of ToastItem. */
export interface ToastItemProps {
  /** The queued toast to draw, with its content as `toast()` stored it. */
  readonly toast: QueuedToast<ToastContentValue>;
  /** The accessible name of the dismiss button. */
  readonly dismissLabel: string;
}
