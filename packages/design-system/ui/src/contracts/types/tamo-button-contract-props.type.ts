/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TamoButton` takes: the Tamo action button with its brand-gradient glow border, the
 *          shimmer while working, its size, and the icon-only form used inside fields.
 * Boundary: types only; the words default to the `ui` catalogue's "Ask Tamo".
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { Size } from "#contracts/enums/size.enum";
import type { TamoStatus } from "#contracts/enums/tamo-status.enum";

/** Props shared by the web and native `TamoButton`. */
export interface TamoButtonContractProps {
  /** The words, and the name when icon-only. Defaults to "Ask Tamo". */
  readonly label?: string | undefined;
  /** True to draw only the mark (inside a field); the label stays its accessible name. */
  readonly isIconOnly?: boolean | undefined;
  /** `sm`, `md` (the default) or `lg`. */
  readonly size?: Size | undefined;
  /** `working` runs the shimmer round the border and marks the button busy. Defaults to `idle`. */
  readonly status?: TamoStatus | undefined;
  /** True to refuse presses. */
  readonly isDisabled?: boolean | undefined;
  /** Called on a press. */
  readonly onPress?: (() => void) | undefined;
}
