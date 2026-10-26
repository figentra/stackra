/**
 * Stackra file contract:
 * Purpose: `SingleColumnLayoutProps`, the props of the native `SingleColumnLayout` in `single-column-layout.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0303 (decision 7); ADR 0317 (decision 7).
 */
import type { ViewProps } from "react-native";
import type { SingleColumnLayoutContractProps } from "#contracts/types/single-column-layout-contract-props.type";

/** Props of the native SingleColumnLayout: the shared contract plus the `View`'s own props, passed through. */
export type SingleColumnLayoutProps = SingleColumnLayoutContractProps &
  Omit<ViewProps, keyof SingleColumnLayoutContractProps>;
