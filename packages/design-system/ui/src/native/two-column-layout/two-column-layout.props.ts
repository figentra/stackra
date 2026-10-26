/**
 * Stackra file contract:
 * Purpose: `TwoColumnLayoutProps`, the props of the native `TwoColumnLayout` in `two-column-layout.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0303 (decision 7); ADR 0317 (decisions 6 and 7).
 */
import type { ViewProps } from "react-native";
import type { TwoColumnLayoutContractProps } from "#contracts/types/two-column-layout-contract-props.type";

/** Props of the native TwoColumnLayout: the shared contract plus the `View`'s own props, passed through. */
export type TwoColumnLayoutProps = TwoColumnLayoutContractProps &
  Omit<ViewProps, keyof TwoColumnLayoutContractProps>;
