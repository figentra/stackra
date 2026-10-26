/**
 * Stackra file contract:
 * Purpose: `TabsProps`, the props of the native `Tabs` in `tabs.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0313 (decisions 1, 2, 5 and 7); owner decision 6 of STA-350 (thin wrappers).
 */
import type { Tabs as HeroTabs } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { TabsContractProps } from "#contracts/types/tabs-contract-props.type";

/**
 * Props of the native Tabs: the shared contract plus HeroUI Native's own tabs props, passed through unchanged. The
 * tabs are `items`, never children, and the selection is a list of ids, never HeroUI's `value`.
 */
export type TabsProps = TabsContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroTabs>,
    keyof TabsContractProps | "children" | "value" | "onValueChange"
  >;
