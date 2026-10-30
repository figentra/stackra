/**
 * Stackra file contract:
 * Purpose: the native `ToastProvider` on HeroUI Native's ToastProvider: mounts the stack of toasts that `toast()` fills,
 *          once near the root of the app, against the top or the bottom of the screen (`position`, HeroUI Native's
 *          `placement`), with the dismiss button of every toast named by the required `dismissLabel`.
 * Boundary: connects HeroUI Native's toast manager to `toastBridge`, so `toast()` works from any file; mount one
 *           provider, inside the `DesignSystemProvider` (its theme and safe-area context). Every other HeroUI Native
 *           provider prop (`insets`, `maxVisibleToasts`, `contentWrapper`, `disableFullWindowOverlay`) passes through.
 *           HeroUI Native's `defaultProps` is the provider's own: `position` fills its `placement`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 2); ADR 0165 (HeroUI Native on native); WCAG 2.2 SC
 *          4.1.3.
 */
import { ToastProvider as HeroToastProvider, useToast } from "heroui-native";
import { useEffect, useMemo, type ReactElement, type ReactNode } from "react";
import { View } from "react-native";

import type { ToastAlign } from "#contracts/enums/toast-align.enum";
import type { ToastProviderContractProps } from "#contracts/types/toast-provider-contract-props.type";
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

/** The toast stack: put one inside the `DesignSystemProvider`, and call `toast()` from anywhere. */
export function ToastProvider({
  dismissLabel,
  position = "bottom",
  align = "full",
  variant = "alert",
  children,
  ...rest
}: ToastProviderProps): ReactElement {
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
      defaultProps={defaultProps}
    >
      <ToastConnection dismissLabel={dismissLabel} variant={variant} />
      {children}
    </HeroToastProvider>
  );
}
