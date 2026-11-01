/**
 * Stackra file contract:
 * Purpose: `TamoStatusLineProps`, the props of the web `TamoStatusLine` in `tamo-status-line.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { TamoStatusContractProps } from "#contracts/types/tamo-status-contract-props.type";

/** Props of the web TamoStatusLine: the shared contract plus a class for its root. */
export type TamoStatusLineProps = TamoStatusContractProps & {
  /** Classes added to the root. */
  readonly className?: string | undefined;
};
