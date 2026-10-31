/**
 * Stackra file contract:
 * Purpose: `TamoMenuProps`, the props of the web `TamoMenu` in `tamo-menu.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { TamoMenuContractProps } from "#contracts/types/tamo-menu-contract-props.type";

/** Props of the web TamoMenu: the shared contract plus a class for its root. */
export type TamoMenuProps = TamoMenuContractProps & {
  /** Classes added to the root. */
  readonly className?: string | undefined;
  /** Called when the menu opens or closes. */
  readonly onOpenChange?: ((isOpen: boolean) => void) | undefined;
};
