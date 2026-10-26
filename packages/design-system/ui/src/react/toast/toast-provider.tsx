/**
 * Stackra file contract:
 * Purpose: the web `ToastProvider` on HeroUI v3's Toast region: mounts the stack of toasts that `toast()` fills, once
 *          near the root of the app, against the top or the bottom of the screen (`position`, HeroUI's `placement`),
 *          with the dismiss button of every toast named by the required `dismissLabel`.
 * Boundary: renders nothing while no toast is open (HeroUI's region unmounts); a toast shown before the provider mounts
 *           waits in the queue and appears when it does. Every other HeroUI region prop (`gap`, `width`,
 *           `maxVisibleToasts`, `hotkey`, `aria-label`, `className`) passes through; the region's own name, "Notifications",
 *           is React Aria's English default, so an app in another language passes `aria-label`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 2); WCAG 2.2 SC 4.1.3 and 2.1.1.
 */
import { Toast as HeroToast } from "@heroui/react";
import type { ReactElement } from "react";

import { ToastItem } from "#react/toast/toast-item";
import type { ToastProviderProps } from "#react/toast/toast-provider.props";

/** The toast region: put one near the root of the app, and call `toast()` from anywhere. */
export function ToastProvider({
  dismissLabel,
  position = "bottom",
  ...rest
}: ToastProviderProps): ReactElement {
  return (
    <HeroToast.Provider {...rest} placement={position}>
      {({ toast }) => <ToastItem toast={toast} dismissLabel={dismissLabel} />}
    </HeroToast.Provider>
  );
}
