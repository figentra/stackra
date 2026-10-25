/**
 * Stackra file contract:
 * Purpose: `batchZpl`, several ZPL labels joined into one document, so a thermal printer prints a batch in one job.
 * Boundary: pure. ZPL formats are self-contained (`^XA … ^XZ`), so joining them is concatenation with a line break
 *           between. A PDF label or an empty list is a `RangeError`: merging PDFs is a document operation for
 *           `@stackra/documents`, not this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 5); ADR 0339 (decision 1: `LabelPrinter` prints ZPL).
 */
import { LabelFormat } from "#contracts/enums/label-format.enum";
import type { LabelDocument } from "#contracts/types/label-document.type";

/** A line break between two formats. */
const NEWLINE = Uint8Array.of(0x0a);

/**
 * One ZPL document holding every label, in order.
 *
 * @example
 * await printer.print(batchZpl(shipments.flatMap((shipment) => shipment.labels)).bytes);
 * @throws RangeError when `labels` is empty or holds a label that is not ZPL.
 */
export function batchZpl(labels: readonly LabelDocument[]): LabelDocument {
  if (labels.length === 0) throw new RangeError("batchZpl: there are no labels to join");
  const parts: Uint8Array[] = [];
  for (const [index, label] of labels.entries()) {
    if (label.format !== LabelFormat.Zpl)
      throw new RangeError(`batchZpl: label ${index} is ${label.format}, not zpl`);
    if (index > 0) parts.push(NEWLINE);
    parts.push(label.bytes);
  }
  const bytes = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return { format: LabelFormat.Zpl, bytes };
}
