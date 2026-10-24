/**
 * Stackra file contract:
 * Purpose: `ScannerViewProps`, the props of the camera view a scanner driver renders: the formats to look for, the
 *          handler each decoded code goes to, and the host element's style.
 * Boundary: a type only. `style` and `className` pass through to the driver's own element (a web `<video>` box, a
 *           native camera view), so they are untyped here.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2).
 */
import type { BarcodeFormat } from "#contracts/types/barcode-format.type";

/** What the scanner's camera view takes. */
export interface ScannerViewProps {
  /** The symbologies to decode; every format the driver knows when absent. */
  readonly formats?: readonly BarcodeFormat[];

  /** Called with each decoded code; the camera keeps firing, so the page decides when to stop listening. */
  readonly onBarcode: (code: string) => void;

  /** The host element's style, passed through as it is. */
  readonly style?: unknown;

  /** The host element's class names (web and Uniwind). */
  readonly className?: string;
}
