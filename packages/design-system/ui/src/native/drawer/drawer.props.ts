/**
 * Stackra file contract:
 * Purpose: `DrawerProps`, the props of the native `Drawer` in `drawer.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0303 (decision 7); ADR 0312; ADR 0165 (HeroUI Native on native); owner decision 6 of STA-350 (thin
 *          wrappers); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
import type { BottomSheetContentProps as HeroSheetContentProps } from "heroui-native";
import type { DrawerContractProps } from "#contracts/types/drawer-contract-props.type";

/**
 * Props of the native Drawer: the shared contract, narrowed so `placement` is `bottom` only, plus HeroUI Native's own
 * sheet-content props, passed through. HeroUI Native's `enablePanDownToClose` is the contract's `isDismissable`, so
 * the type refuses it.
 */
export type DrawerProps = Omit<DrawerContractProps, "placement"> & {
  /** Accepted for the shared call site; a native drawer is always a bottom sheet. */
  readonly placement?: "bottom" | undefined;
} & Omit<
    HeroSheetContentProps,
    keyof DrawerContractProps | "enablePanDownToClose" | "accessibilityLabel"
  >;
