/**
 * Stackra file contract:
 * Purpose: `TamoGhostTextProps`, the props of the web `TamoGhostText` in `tamo-ghost-text.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { TamoGhostTextContractProps } from "#contracts/types/tamo-ghost-text-contract-props.type";

/** Props of the web TamoGhostText: the shared contract plus a class for its root. */
export type TamoGhostTextProps = TamoGhostTextContractProps & {
  /** Classes added to the root. */
  readonly className?: string | undefined;
};
