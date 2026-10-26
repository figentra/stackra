/**
 * Stackra file contract:
 * Purpose: `SidebarProps`, the props of the native `Sidebar` in `sidebar.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0303 (decision 7); ADR 0317 (decisions 1, 4 and 7); WCAG 2.2 SC 1.3.1 and 4.1.2.
 */
import type { ViewProps } from "react-native";
import type { SidebarContractProps } from "#contracts/types/sidebar-contract-props.type";

/**
 * Props of the native Sidebar: the shared contract plus the root `View`'s own props, passed through. The sidebar's
 * content is `items` and its two slots, so the type refuses JSX children.
 */
export type SidebarProps = SidebarContractProps &
  Omit<ViewProps, keyof SidebarContractProps | "children">;
