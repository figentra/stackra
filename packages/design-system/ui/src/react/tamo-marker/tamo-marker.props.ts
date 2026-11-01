/**
 * Stackra file contract:
 * Purpose: `TamoMarkerProps`, the props of the web `TamoMarker` in `tamo-marker.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { TamoMarkerContractProps } from "#contracts/types/tamo-marker-contract-props.type";

/** Props of the web TamoMarker: the shared contract plus a class for its root. */
export type TamoMarkerProps = TamoMarkerContractProps & {
  /** Classes added to the root. */
  readonly className?: string | undefined;
};
