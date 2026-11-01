/**
 * Stackra file contract:
 * Purpose: `TamoPanelProps`, the props of the web `TamoPanel` in `tamo-panel.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { TamoPanelContractProps } from "#contracts/types/tamo-panel-contract-props.type";

/** Props of the web TamoPanel: the shared contract plus a class for the drawer's body. */
export type TamoPanelProps = TamoPanelContractProps & {
  /** Classes added to the panel's log. */
  readonly className?: string | undefined;
};
