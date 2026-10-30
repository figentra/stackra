/**
 * Stackra file contract:
 * Purpose: `DrawerSubHeaderProps`, the props of the web `Drawer.SubHeader` in `drawer-sub-header.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0302 (decision 3).
 */
import type { HTMLAttributes } from "react";

import type { DrawerPartContractProps } from "#contracts/types/drawer-part-contract-props.type";

/** Props of the web drawer sub-header: the shared contract plus the element's own attributes. */
export type DrawerSubHeaderProps = DrawerPartContractProps &
  Omit<HTMLAttributes<HTMLElement>, keyof DrawerPartContractProps>;
