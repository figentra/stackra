/**
 * Stackra file contract:
 * Purpose: `LabelDocument`, a printable carrier label: its format and its bytes.
 * Boundary: a type in the leaf entry. Build one with `labelDocument` from the `.` entry, which checks the bytes are
 *           the format they claim; storing it is `@stackra/documents`' job and printing a ZPL one is
 *           `@stackra/peripherals`' `LabelPrinter`.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 5); ADR 0339 (decision 1).
 */
import type { LabelFormat } from "#contracts/enums/label-format.enum";

/**
 * A label to print.
 *
 * @example
 * await printer.print(batchZpl(shipments.flatMap((s) => s.labels)).bytes);
 */
export interface LabelDocument {
  /** PDF or ZPL. */
  readonly format: LabelFormat;

  /** The document's bytes. */
  readonly bytes: Uint8Array;
}
