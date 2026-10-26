/**
 * Stackra file contract:
 * Purpose: `ToastProviderProps`, the props of the web `ToastProvider` in `toast-provider.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312 (decision
 *          2); WCAG 2.2 SC 4.1.3 and 2.1.1.
 */
import type { ToastProviderProps as HeroToastProviderProps } from "@heroui/react";
import type { ToastProviderContractProps } from "#contracts/types/toast-provider-contract-props.type";

/**
 * Props of the web ToastProvider: the shared contract plus HeroUI v3's own region props, passed through. HeroUI's
 * `placement` is the contract's `position`; its queue and children are the component's own.
 */
export type ToastProviderProps = ToastProviderContractProps &
  Omit<
    HeroToastProviderProps,
    keyof ToastProviderContractProps | "placement" | "queue" | "children"
  >;
