/**
 * Stackra file contract:
 * Purpose: `FabProps`, the props of the native `Fab` in `fab.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ViewProps } from "react-native";
import type { FabContractProps } from "#contracts/types/fab-contract-props.type";

/** Props of the native Fab: the shared contract plus the root's own props, passed through. */
export type FabProps = FabContractProps & Omit<ViewProps, keyof FabContractProps>;
