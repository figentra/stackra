/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TamoMark` takes: Tamo's tile mark, its state and size, and an optional name.
 * Boundary: types only. Without a `label` the mark is decorative (the words beside it carry the meaning).
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { Size } from "#contracts/enums/size.enum";
import type { TamoStatus } from "#contracts/enums/tamo-status.enum";

/** Props shared by the web and native `TamoMark`. */
export interface TamoMarkContractProps {
  /** The mark's spoken name; left out, the mark is hidden from assistive technology. */
  readonly label?: string | undefined;
  /** `working` scans the eyes (still under reduced motion), `error` flattens them. Defaults to `idle`. */
  readonly status?: TamoStatus | undefined;
  /** `sm` 16, `md` 20 (the default), `lg` 28. */
  readonly size?: Size | undefined;
}
