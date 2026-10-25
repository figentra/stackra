/**
 * Stackra file contract:
 * Purpose: `DocumentFormat`, the formats one print template renders to, each with its media type.
 * Boundary: an enum (`Enum.of`) with data; read the media type with `Enum.meta(DocumentFormat, format).mediaType`.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * What `renderDocument` writes.
 *
 * @example
 * Enum.meta(DocumentFormat, DocumentFormat.Pdf).mediaType; // "application/pdf"
 */
export const DocumentFormat = Enum.of({
  /** A whole HTML page with print CSS; the source of the PDF. */
  Html: ["html", { mediaType: "text/html; charset=utf-8" }],
  /** The HTML printed by the `PdfEngine`. */
  Pdf: ["pdf", { mediaType: "application/pdf" }],
  /** A Word document, for drafting and editing. */
  Docx: [
    "docx",
    { mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  ],
});

/** One of the codes above. */
export type DocumentFormat = Enum.Value<typeof DocumentFormat>;
