/**
 * Stackra file contract:
 * Purpose: `TamoAskBoxProps`, the props of the web `TamoAskBox` in `tamo-ask-box.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { TamoAskBoxContractProps } from "#contracts/types/tamo-ask-box-contract-props.type";

/** Props of the web TamoAskBox: the shared contract plus a class for its root. */
export type TamoAskBoxProps<TProposal> = TamoAskBoxContractProps<TProposal> & {
  /** Classes added to the root. */
  readonly className?: string | undefined;
};
