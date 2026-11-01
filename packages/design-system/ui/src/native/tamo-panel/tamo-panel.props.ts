/**
 * Stackra file contract:
 * Purpose: `TamoPanelProps`, the props of the native `TamoPanel` in `tamo-panel.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { TamoPanelContractProps } from "#contracts/types/tamo-panel-contract-props.type";

/** Props of the native TamoPanel: the shared contract plus a class for its log. */
export type TamoPanelProps = TamoPanelContractProps & {
  /** Classes added to the panel's log. */
  readonly className?: string | undefined;
};
