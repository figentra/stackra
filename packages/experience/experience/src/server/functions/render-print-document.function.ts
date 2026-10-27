/**
 * Stackra file contract:
 * Purpose: `renderPrintDocument`, a studio print document (a receipt, an invoice layout, a packing slip, a label)
 *          rendered by the node renderer and printed to PDF through @stackra/documents' `PdfEngine`.
 * Boundary: checks the document as `ExperienceKind.PrintDocument` and draws it before calling the engine, so a refused
 *           document never reaches it. The HTML holds inline data only (images as `data:` URLs written by blocks), so
 *           the engine fetches nothing. An engine failure propagates as the engine threw it.
 * Runtime: node
 * Governing contract: ADR 0270 (decision 6); ADR 0365 (decision 2).
 */
import { ExperienceKind } from "#contracts/enums/experience-kind.enum";
import { renderServerHtml } from "#server/functions/render-server-html.function";
import type { PrintRenderOptions } from "#server/types/print-render-options.type";
import type { RenderedPrint } from "#server/types/rendered-print.type";

/**
 * The PDF of `document`.
 *
 * @example
 * const { pdf } = await renderPrintDocument(layout.root, { locale, direction, blocks: PRINT_BLOCKS, data: { order }, engine, page: layout.page });
 * @throws UnknownBlockError, InvalidDocumentError as `renderServerHtml`; whatever the engine throws.
 */
export async function renderPrintDocument(
  document: unknown,
  options: PrintRenderOptions,
): Promise<RenderedPrint> {
  const html = renderServerHtml(document, ExperienceKind.PrintDocument, options);
  return { html, pdf: await options.engine.print(html, options.page) };
}
