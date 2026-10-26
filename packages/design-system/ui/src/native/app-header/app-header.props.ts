/**
 * Stackra file contract:
 * Purpose: `AppHeaderProps`, the props of the native `AppHeader` in `app-header.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0303 (decision 7); ADR 0317 (decisions 1, 4 and 7); WCAG 2.2 SC 1.3.1 and 2.5.8.
 */
import type { ViewProps } from "react-native";
import type { AppHeaderContractProps } from "#contracts/types/app-header-contract-props.type";

/**
 * Props of the native AppHeader: the shared contract plus the root `View`'s own props, passed through. The view's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type AppHeaderProps = AppHeaderContractProps &
  Omit<ViewProps, keyof AppHeaderContractProps | "accessibilityLabel" | "children">;
