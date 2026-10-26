/**
 * Stackra file contract:
 * Purpose: `TabsProps`, the props of the web `Tabs` in `tabs.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0313 (decisions 1, 2, 5); WAI-ARIA 1.2 tabs pattern; owner decision 6 of
 *          STA-350 (thin wrappers).
 */
import type { TabsRootProps } from "@heroui/react";
import type { TabsContractProps } from "#contracts/types/tabs-contract-props.type";

/**
 * Props of the web Tabs: the shared contract plus HeroUI v3's own tabs props, passed through unchanged. The tabs are
 * `items`, never children, and the selection is a list of ids, never HeroUI's `selectedKey`.
 */
export type TabsProps = TabsContractProps &
  Omit<
    TabsRootProps,
    | keyof TabsContractProps
    | "children"
    | "selectedKey"
    | "defaultSelectedKey"
    | "onSelectionChange"
    | "disabledKeys"
  >;
