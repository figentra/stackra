/**
 * Stackra file contract:
 * Purpose: `TamoStatusLineProps`, the props of the native `TamoStatusLine` in `tamo-status-line.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { TamoStatusContractProps } from "#contracts/types/tamo-status-contract-props.type";

/** Props of the native TamoStatusLine: the shared contract plus a class for its root. */
export type TamoStatusLineProps = TamoStatusContractProps & {
  /** Classes added to the root. */
  readonly className?: string | undefined;
};
