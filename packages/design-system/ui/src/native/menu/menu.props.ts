/**
 * Stackra file contract:
 * Purpose: `MenuProps`, the props of the native `Menu` in `menu.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312; ADR 0165
 *          (HeroUI Native on native); ADR 0060 (right-to-left); owner decision 6 of STA-350 (thin wrappers).
 */
import type { MenuRootProps } from "heroui-native";
import type { MenuContractProps } from "#contracts/types/menu-contract-props.type";

/**
 * Props of the native Menu: the shared contract plus HeroUI Native's own menu props, passed through unchanged. The app
 * lists actions as `sections`; the only child is the trigger. `presentation` is kept (popover or bottom sheet).
 */
export type MenuProps = MenuContractProps &
  Omit<MenuRootProps, keyof MenuContractProps | "children" | "isDefaultOpen">;
