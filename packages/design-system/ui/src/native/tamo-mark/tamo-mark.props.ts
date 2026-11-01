/**
 * Stackra file contract:
 * Purpose: `TamoMarkProps`, the props of the native `TamoMark` in `tamo-mark.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { TamoMarkContractProps } from "#contracts/types/tamo-mark-contract-props.type";

/** Props of the native TamoMark: the shared contract plus a class for its root. */
export type TamoMarkProps = TamoMarkContractProps & {
  /** Classes added to the root. */
  readonly className?: string | undefined;
};
