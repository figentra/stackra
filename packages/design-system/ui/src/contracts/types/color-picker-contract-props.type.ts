/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ColorPicker` takes: a colour as a hex string, chosen from swatches or typed (and
 *          on the web from a saturation area and a hue slider).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `ColorPicker`. */
export interface ColorPickerContractProps extends FieldContractProps<string> {
  /** Ready-made colours, as `#rrggbb`; defaults to the house set. */
  readonly swatches?: readonly string[] | undefined;
}
