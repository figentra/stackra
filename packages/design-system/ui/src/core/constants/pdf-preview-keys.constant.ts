/**
 * Stackra file contract:
 * Purpose: `PDF_PREVIEW_KEYS`, the typed keys of the PdfPreview's words in `assets/lang/<locale>/ui.json`: the frame's
 *          title, the download button and the line for a browser that cannot show a PDF.
 * Boundary: internal: the web entry imports it by path. Each key exists in every base locale this package ships.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`).
 */
import { keys } from "@stackra/i18n";

/** The PdfPreview's keys. */
export const PDF_PREVIEW_KEYS = keys({
  ui: {
    pdf_preview: ["title", "download", "unavailable"],
  },
});
