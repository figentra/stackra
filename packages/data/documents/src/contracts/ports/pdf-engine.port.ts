/**
 * Stackra file contract:
 * Purpose: the `PdfEngine` port: prints the HTML that `renderHtml` wrote onto a page and answers the PDF's bytes.
 * Boundary: an abstract class that is its own token, keyed `documents.PdfEngine`. The engine shapes Arabic and lays out
 *           mixed-direction text itself (a browser engine does), so the HTML carries `dir`, `lang` and `<bdi>` and
 *           nothing pre-shaped. Which engine runs is a binding or a Connection (ADR 0356); its drivers live with the
 *           runtime that hosts the engine, never in this package. The HTML holds only inline data (images are
 *           `data:` URLs), so an engine must not fetch anything while printing.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { PdfPage } from "#contracts/types/pdf-page.type";

/**
 * Turns a rendered HTML document into a PDF.
 *
 * @example
 * const pdf = await engine.print(renderHtml(resolved), resolved.template.page);
 */
export abstract class PdfEngine extends Port {
  /** Type-only port key, so `DriverName<PdfEngine>` narrows to this port's drivers. */
  declare readonly "~key": "documents.PdfEngine";

  /**
   * The PDF of `html` printed on `page`.
   *
   * @throws Error when the engine cannot be reached or fails to print.
   */
  abstract print(html: string, page: PdfPage): Promise<Uint8Array>;
}
