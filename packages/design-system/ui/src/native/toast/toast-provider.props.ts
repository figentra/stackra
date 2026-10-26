/**
 * Stackra file contract:
 * Purpose: `ToastProviderProps`, the props of the native `ToastProvider` in `toast-provider.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312 (decision
 *          2); ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 4.1.3.
 */
import type { ToastProviderProps as HeroToastProviderProps } from "heroui-native";
import type { ToastProviderContractProps } from "#contracts/types/toast-provider-contract-props.type";

/**
 * Props of the native ToastProvider: the shared contract plus HeroUI Native's own provider props, passed through.
 * HeroUI Native's `defaultProps` is replaced by the contract's `position`.
 */
export type ToastProviderProps = ToastProviderContractProps &
  Omit<HeroToastProviderProps, keyof ToastProviderContractProps | "defaultProps">;
