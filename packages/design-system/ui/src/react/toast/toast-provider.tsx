/**
 * Stackra file contract:
 * Purpose: the web `ToastProvider` on HeroUI v3's Toast region: mounts the stack of toasts that `toast()` fills, once
 *          near the root of the app, against the top or the bottom of the screen (`position`, HeroUI's `placement`),
 *          with the dismiss button of every toast named by the required `dismissLabel`. `align` puts the stack at the
 *          inline start, the centre, the inline end (HeroUI's `bottom start` and so on, laid out with logical insets,
 *          so they follow the text direction) or full width; `variant` is the look of every toast in it.
 * Boundary: renders nothing while no toast is open (HeroUI's region unmounts); a toast shown before the provider mounts
 *           waits in the queue and appears when it does. Every other HeroUI region prop (`gap`, `width`,
 *           `maxVisibleToasts`, `hotkey`, `aria-label`, `className`) passes through; the region's own name, "Notifications",
 *           is React Aria's English default, so an app in another language passes `aria-label`. While a floating Fab is
 *           on screen, a bottom stack on a phone-width layout sits above it (`FLOATING_FABS`), clear of the home indicator.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 2); WCAG 2.2 SC 4.1.3 and 2.1.1.
 */
import { cn, Toast as HeroToast } from "@heroui/react";
import { useSyncExternalStore, type ReactElement } from "react";

import { FLOATING_FABS } from "#core/constants/floating-fabs.constant";
import { ToastItem } from "#react/toast/toast-item";
import type { ToastProviderProps } from "#react/toast/toast-provider.props";

/** The width of a full-width stack: the screen less HeroUI's 1rem inset on each side. */
const FULL_WIDTH = "calc(100vw - 2rem)";

/** The width of every other stack: about 22rem, so the text wraps rather than running long. HeroUI's default is 460 px. */
const WIDTH = "22rem";

/**
 * The lift of a bottom stack while a floating Fab is on screen, below `md` only (where the stack spans the Fab's
 * corner): HeroUI's 1rem inset, the large Fab (3rem), the gap the Fab keeps from the edge (1rem) and one step of
 * space, over the home-indicator inset. Wider layouts keep the stack beside the Fab.
 */
const CLEAR_FAB = "max-md:bottom-[calc(5.75rem+env(safe-area-inset-bottom))]";

/** No Fab is drawn on the server. */
const NONE = (): number => 0;

/** The toast region: put one near the root of the app, and call `toast()` from anywhere. */
export function ToastProvider({
  dismissLabel,
  position = "bottom",
  align = "center",
  variant = "alert",
  className,
  ...rest
}: ToastProviderProps): ReactElement {
  const fabs = useSyncExternalStore(FLOATING_FABS.subscribe, FLOATING_FABS.count, NONE);
  const lift = position === "bottom" && fabs > 0 ? CLEAR_FAB : undefined;
  const placement =
    align === "start" || align === "end" ? (`${position} ${align}` as const) : position;
  return (
    <HeroToast.Provider
      width={align === "full" ? FULL_WIDTH : WIDTH}
      {...rest}
      className={
        typeof className === "function"
          ? (state) => cn(lift, className(state)) ?? ""
          : (cn(lift, className) ?? "")
      }
      placement={placement}
    >
      {({ toast }) => <ToastItem toast={toast} dismissLabel={dismissLabel} variant={variant} />}
    </HeroToast.Provider>
  );
}
