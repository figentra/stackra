/**
 * Stackra file contract:
 * Purpose: `MenuProps`, the props of the web `Menu` in `menu.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312; ADR 0165
 *          (UI contract, HeroUI v3 on web); owner decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 2.1.1, 4.1.2.
 */
import type { DropdownRootProps } from "@heroui/react";
import type { MenuContractProps } from "#contracts/types/menu-contract-props.type";

/**
 * Props of the web Menu: the shared contract plus HeroUI v3's own Dropdown props (`trigger`, for one), passed through
 * unchanged. The app lists actions as `sections`; the only child is the trigger.
 */
export type MenuProps = MenuContractProps &
  Omit<DropdownRootProps, keyof MenuContractProps | "children">;
