/**
 * Stackra file contract:
 * Purpose: the native `ToastProvider` on HeroUI Native's ToastProvider: mounts the stack of toasts that `toast()` fills,
 *          once near the root of the app, against the top or the bottom of the screen (`position`, HeroUI Native's
 *          `placement`), with the dismiss button of every toast named by the required `dismissLabel`.
 * Boundary: connects HeroUI Native's toast manager to `toastBridge`, so `toast()` works from any file; mount one
 *           provider, inside the `DesignSystemProvider` (its theme and safe-area context). Every other HeroUI Native
 *           provider prop (`insets`, `maxVisibleToasts`, `contentWrapper`, `disableFullWindowOverlay`) passes through.
 *           HeroUI Native's `defaultProps` is the provider's own: `position` fills its `placement`. While a floating Fab is on
 *           screen (`FLOATING_FABS`), a bottom stack sits above it, clear of the home indicator.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 2); ADR 0165 (HeroUI Native on native); WCAG 2.2 SC
 *          4.1.3.
 */
import { ToastProvider as HeroToastProvider, useToast } from "heroui-native";
import { useEffect, useMemo, useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ToastAlign } from "#contracts/enums/toast-align.enum";
import type { ToastProviderContractProps } from "#contracts/types/toast-provider-contract-props.type";
import { FLOATING_FABS } from "#core/constants/floating-fabs.constant";
import { toastBridge } from "#native/toast/toast-bridge";
import type { ToastProviderProps } from "#native/toast/toast-provider.props";

/** Hands HeroUI Native's manager to the bridge every time it changes, and takes it back when it unmounts. */
function ToastConnection({
  dismissLabel,
  variant,
}: Pick<ToastProviderContractProps, "dismissLabel" | "variant">) {
  const { toast } = useToast();
  useEffect(() => {
    toastBridge.connect(toast, dismissLabel, variant);
    return () => toastBridge.disconnect();
  }, [toast, dismissLabel, variant]);
  return null;
}

/** The column each alignment narrows the stack to; HeroUI Native asks the wrapper to keep `flex-1`. */
const COLUMN: Readonly<Record<Exclude<ToastAlign, "full">, string>> = {
  start: "w-full max-w-sm flex-1 self-start",
  center: "w-full max-w-sm flex-1 self-center",
  end: "w-full max-w-sm flex-1 self-end",
};

/**
 * The bottom gap of a stack while a floating Fab is on screen, over the home-indicator inset: the large Fab (48), its
 * gap from the edge (16) and one step of space (12).
 */
const CLEAR_FAB = 76;

/** No Fab is drawn before the first render. */
const NONE = (): number => 0;

/** The toast stack: put one inside the `DesignSystemProvider`, and call `toast()` from anywhere. */
export function ToastProvider({
  dismissLabel,
  position = "bottom",
  align = "full",
  variant = "alert",
  children,
  insets,
  ...rest
}: ToastProviderProps): ReactElement {
  const fabs = useSyncExternalStore(FLOATING_FABS.subscribe, FLOATING_FABS.count, NONE);
  const safeArea = useSafeAreaInsets();
  // HeroUI Native takes a given bottom inset as the whole gap, so the safe area is added here.
  const lifted =
    position === "bottom" && fabs > 0
      ? { ...insets, bottom: safeArea.bottom + CLEAR_FAB + (insets?.bottom ?? 0) }
      : insets;
  // Memoised because HeroUI Native memoises its global config on this object's identity.
  const defaultProps = useMemo(() => ({ placement: position }), [position]);
  const contentWrapper = useMemo(
    () =>
      align === "full"
        ? undefined
        : (content: ReactNode) => <View className={COLUMN[align]}>{content}</View>,
    [align],
  );
  return (
    <HeroToastProvider
      {...(contentWrapper ? { contentWrapper } : {})}
      {...rest}
      {...(lifted ? { insets: lifted } : {})}
      defaultProps={defaultProps}
    >
      <ToastConnection dismissLabel={dismissLabel} variant={variant} />
      {children}
    </HeroToastProvider>
  );
}
