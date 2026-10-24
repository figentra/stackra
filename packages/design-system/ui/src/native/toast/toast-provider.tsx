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
import {
  ToastProvider as HeroToastProvider,
  useToast,
  type ToastProviderProps as HeroToastProviderProps,
} from "heroui-native";
import { useEffect, useMemo, type ReactElement } from "react";

import type { ToastProviderContractProps } from "#contracts/types/toast-contract-props.type";
import { toastBridge } from "#native/toast/toast-bridge";

/**
 * Props of the native ToastProvider: the shared contract plus HeroUI Native's own provider props, passed through.
 * HeroUI Native's `defaultProps` is replaced by the contract's `position`.
 */
export type ToastProviderProps = ToastProviderContractProps &
  Omit<HeroToastProviderProps, keyof ToastProviderContractProps | "defaultProps">;

/** Hands HeroUI Native's manager to the bridge every time it changes, and takes it back when it unmounts. */
function ToastConnection({ dismissLabel }: Pick<ToastProviderContractProps, "dismissLabel">) {
  const { toast } = useToast();
  useEffect(() => {
    toastBridge.connect(toast, dismissLabel);
    return () => toastBridge.disconnect();
  }, [toast, dismissLabel]);
  return null;
}

/** The toast stack: put one inside the `DesignSystemProvider`, and call `toast()` from anywhere. */
export function ToastProvider({
  dismissLabel,
  position = "bottom",
  children,
  ...rest
}: ToastProviderProps): ReactElement {
  // Memoised because HeroUI Native memoises its global config on this object's identity.
  const defaultProps = useMemo(() => ({ placement: position }), [position]);
  return (
    <HeroToastProvider {...rest} defaultProps={defaultProps}>
      <ToastConnection dismissLabel={dismissLabel} />
      {children}
    </HeroToastProvider>
  );
}
