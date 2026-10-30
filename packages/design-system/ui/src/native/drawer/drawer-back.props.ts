/**
 * Stackra file contract:
 * Purpose: `DrawerBackProps`, the props of the native `Drawer.Back` in `drawer-back.tsx`.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0302 (decision 3).
 */
import type { DrawerBackContractProps } from "#contracts/types/drawer-back-contract-props.type";

/** Props of the native Drawer.Back: the shared contract. */
export type DrawerBackProps = DrawerBackContractProps;
