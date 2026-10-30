/**
 * Stackra file contract:
 * Purpose: the props every runtime's `CopyButton` takes: the text it copies, its two accessible names (before and
 *          after the copy) and a callback; the rest is the IconButton's look.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); design-system gap inventory row 35.
 */
import type { IconButtonContractProps } from "#contracts/types/icon-button-contract-props.type";

/** Props shared by the web and native `CopyButton`. */
export interface CopyButtonContractProps extends Omit<
  IconButtonContractProps,
  "icon" | "label" | "onPress" | "isLoading"
> {
  /** The text copied to the clipboard. */
  readonly value: string;
  /** The accessible name before the copy, for example "Copy order number". Defaults to "Copy". */
  readonly label?: string | undefined;
  /** The name and announcement once copied. Defaults to "Copied". */
  readonly copiedLabel?: string | undefined;
  /** Called with `value` once it is on the clipboard. */
  readonly onCopy?: ((value: string) => void) | undefined;
}
