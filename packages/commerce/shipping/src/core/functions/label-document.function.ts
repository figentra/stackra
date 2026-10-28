/**
 * Stackra file contract:
 * Purpose: `labelDocument`, a `LabelDocument` built from what a carrier returned (bytes, or base64 text) after checking
 *          the bytes are the format claimed: a PDF starts `%PDF-`; a ZPL document holds `^XA` and ends `^XZ`.
 * Boundary: pure; called by a connector at its edge, so a broken label is refused before it is stored or printed. It
 *           checks the envelope only: it does not render the PDF or parse the ZPL commands. Refusals are
 *           `LabelDocumentInvalidError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 5).
 */
import { LabelFormat } from "#contracts/enums/label-format.enum";
import type { LabelDocument } from "#contracts/types/label-document.type";
import { LabelDocumentInvalidError } from "#core/errors/label-document-invalid.error";

/** The bytes of base64 text, or null when it is not base64. */
function fromBase64(text: string): Uint8Array | null {
  try {
    const binary = atob(text.replace(/\s+/g, ""));
    // oxlint-disable-next-line unicorn/prefer-code-point -- a binary string: every character is one byte, so the code unit is the byte
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

/** True when the bytes are the envelope of `format`. */
function hasSignature(format: LabelFormat, bytes: Uint8Array): boolean {
  // Both signatures are ASCII; Latin-1 keeps one character per byte whatever the rest of the document holds.
  if (format === LabelFormat.Pdf) return String.fromCodePoint(...bytes.subarray(0, 5)) === "%PDF-";
  const zpl = new TextDecoder("latin1").decode(bytes).trimEnd();
  return zpl.includes("^XA") && zpl.endsWith("^XZ");
}

/**
 * A checked label document.
 *
 * @param format - the format the carrier says it sent.
 * @param content - the bytes, or the same bytes as base64 text (whitespace ignored).
 * @example
 * const label = labelDocument(LabelFormat.Pdf, response.labelBase64);
 * @throws LabelDocumentInvalidError with `reason` `not_base64`, `empty` or `signature`.
 */
export function labelDocument(format: LabelFormat, content: Uint8Array | string): LabelDocument {
  const bytes = typeof content === "string" ? fromBase64(content) : content;
  if (bytes === null) throw LabelDocumentInvalidError.create({ format, reason: "not_base64" });
  if (bytes.length === 0) throw LabelDocumentInvalidError.create({ format, reason: "empty" });
  if (!hasSignature(format, bytes))
    throw LabelDocumentInvalidError.create({ format, reason: "signature" });
  return { format, bytes };
}
