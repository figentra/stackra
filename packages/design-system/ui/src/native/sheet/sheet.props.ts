/**
 * Stackra file contract:
 * Purpose: `SheetProps`, the props of the native `Sheet` in `sheet.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); STA-1371.
 */
import type { SheetContractProps } from "#contracts/types/sheet-contract-props.type";
import type { DrawerProps } from "#native/drawer/drawer.props";

/**
 * Props of the native Sheet: the shared contract plus HeroUI Native's own sheet-content props (`index`, `onChange`
 * and so on), passed through to the bottom sheet. The Drawer's `size` and `inset` are the Sheet's `isDetached`.
 */
export type SheetProps = SheetContractProps &
  Omit<DrawerProps, keyof SheetContractProps | "size" | "inset" | "isKeyboardDismissDisabled">;
