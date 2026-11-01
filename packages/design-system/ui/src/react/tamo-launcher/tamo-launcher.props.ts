/**
 * Stackra file contract:
 * Purpose: `TamoLauncherProps`, the props of the web `TamoLauncher` in `tamo-launcher.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { TamoLauncherContractProps } from "#contracts/types/tamo-launcher-contract-props.type";

/** Props of the web TamoLauncher: the shared contract plus a class for its root. */
export type TamoLauncherProps = TamoLauncherContractProps & {
  /** Classes added to the root. */
  readonly className?: string | undefined;
};
