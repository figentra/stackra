/**
 * Stackra file contract:
 * Purpose: `BarcodeContractProps`, the props every runtime's `Barcode` takes: a value drawn as a Code 128 or EAN-13
 *          barcode with its digits under it.
 * Boundary: types only. Always dark bars on a light tile, never mirrored in right-to-left; an invalid value shows an
 *           error in place of bars.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ISO/IEC 15417; ISO/IEC 15420; STA-1371
 *          (wave D, owner approval 2026-10-30).
 */
import type { BarcodeFormat } from "#contracts/enums/barcode-format.enum";

/** Props shared by the web and native `Barcode`. */
export interface BarcodeContractProps {
  /** What to encode: printable ASCII for `code128`; 12 or 13 digits for `ean13` (a 13th must be the check digit). */
  readonly value: string;
  /** The symbology. Defaults to `code128`. */
  readonly format?: BarcodeFormat | undefined;
  /** The accessible name. Defaults to the value (with its check digit for EAN-13). */
  readonly label?: string | undefined;
  /** The bars' height in pixels. Defaults to 64; each module is 2 pixels wide. */
  readonly height?: number | undefined;
  /** False to hide the human-readable text under the bars. Defaults to true. */
  readonly showText?: boolean | undefined;
}
