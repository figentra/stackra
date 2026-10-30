/**
 * Stackra file contract:
 * Purpose: `SaveBarProps`, the props of the native `SaveBar` in `save-bar.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 8.
 */
import type { ViewProps } from "react-native";
import type { SaveBarContractProps } from "#contracts/types/save-bar-contract-props.type";

/** Props of the native SaveBar: the shared contract plus the props of its outer `View`, passed through unchanged. */
export type SaveBarProps = SaveBarContractProps & Omit<ViewProps, keyof SaveBarContractProps>;
