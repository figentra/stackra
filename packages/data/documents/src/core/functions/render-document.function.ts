/**
 * Stackra file contract:
 * Purpose: `renderDocument`, one call from a print template and its data to a file: HTML, PDF (the HTML printed by
 *          the `PdfEngine`) or DOCX, with its media type and content hash.
 * Boundary: parses the template (the trust boundary), resolves it and renders it. A PDF needs a `pdfEngine`; asking
 *           for one without it is a wiring mistake and throws `TypeError`. The engine is told the template's page.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decisions 1, 2 and 4).
 */
import { Enum } from "@stackra/contracts";

import type { PdfEngine } from "#contracts/ports/pdf-engine.port";
import { DocumentFormat } from "#core/enums/document-format.enum";
import { contentHashOf } from "#core/functions/content-hash-of.function";
import { parseDocumentTemplate } from "#core/functions/parse-document-template.function";
import { renderDocx } from "#core/functions/render-docx.function";
import { renderHtml } from "#core/functions/render-html.function";
import { resolveDocument } from "#core/functions/resolve-document.function";
import type { DocumentTemplate } from "#core/types/document-template.type";
import type { RenderedDocument } from "#core/types/rendered-document.type";

/**
 * `template` filled with `data`, written as `format`.
 *
 * @throws InvalidDocumentTemplateError when the template breaks its schema or cannot be written as `format`.
 * @throws DocumentValueError when `data` lacks a value the template needs.
 * @throws TypeError when `format` is PDF and no `pdfEngine` is given.
 *
 * @example
 * const receipt = await renderDocument({ template, data: { order }, format: DocumentFormat.Pdf, pdfEngine });
 */
export async function renderDocument(options: {
  readonly template: DocumentTemplate;
  readonly data: Readonly<Record<string, unknown>>;
  readonly format: DocumentFormat;
  readonly pdfEngine?: PdfEngine;
}): Promise<RenderedDocument> {
  const resolved = resolveDocument(parseDocumentTemplate(options.template), options.data);
  let bytes: Uint8Array;
  if (options.format === DocumentFormat.Docx) bytes = await renderDocx(resolved);
  else if (options.format === DocumentFormat.Html)
    bytes = new TextEncoder().encode(renderHtml(resolved));
  else {
    if (options.pdfEngine === undefined)
      throw new TypeError("renderDocument needs a pdfEngine to write a PDF");
    bytes = await options.pdfEngine.print(renderHtml(resolved), resolved.template.page);
  }
  return {
    format: options.format,
    mediaType: Enum.meta(DocumentFormat, options.format).mediaType,
    bytes,
    contentHash: await contentHashOf(bytes),
  };
}
