/**
 * Stackra file contract:
 * Purpose: `TamoAskBoxProps`, the props of the native `TamoAskBox` in `tamo-ask-box.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { TamoAskBoxContractProps } from "#contracts/types/tamo-ask-box-contract-props.type";

/** Props of the native TamoAskBox: the shared contract plus a class for its root. */
export type TamoAskBoxProps<TProposal> = TamoAskBoxContractProps<TProposal> & {
  /** Classes added to the root. */
  readonly className?: string | undefined;
};
