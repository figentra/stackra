/**
 * Stackra file contract:
 * Purpose: `AppShellProps`, the props of the native `AppShell` in `app-shell.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0303 (decision 7); ADR 0312; ADR 0317 (decisions 1, 4, 6, 7 and 8); WCAG 2.2 SC 1.3.1 and 2.1.2.
 */
import type { ViewProps } from "react-native";
import type { AppShellContractProps } from "#contracts/types/app-shell-contract-props.type";

/**
 * Props of the native AppShell: the shared contract plus the root `View`'s own props, passed through.
 */
export type AppShellProps = AppShellContractProps & Omit<ViewProps, keyof AppShellContractProps>;
