/**
 * Stackra file contract:
 * Purpose: `ScanResult`, the answer of `FileScanner.scan`: the verdict and the threats the scanner named.
 * Boundary: a type only. `threats` is empty unless the verdict is `infected`; `detail` carries the scanner's reason
 *           for a `failed` verdict, never the file's contents.
 * Runtime: isomorphic
 * Governing contract: ADR 0222; OS-142.
 */
import type { ScanVerdict } from "#contracts/enums/scan-verdict.enum";

/** One scan's outcome. */
export interface ScanResult {
  /** The verdict. */
  readonly verdict: ScanVerdict;

  /** The threat names the scanner reported (`Eicar-Signature`). */
  readonly threats: readonly string[];

  /** Why the scanner could not decide, for a `failed` verdict. */
  readonly detail?: string;
}
