/**
 * Stackra file contract:
 * Purpose: `GotenbergPdfEngineDriver`, the `gotenberg` driver of `PdfEngine`: prints the HTML in headless Chromium
 *          through a Gotenberg engine (`POST /forms/chromium/convert/html`). Chromium shapes Arabic and lays out
 *          mixed-direction text itself, from the `dir`, `lang` and `<bdi>` that `renderHtml` writes.
 * Boundary: plain `fetch`, no SDK. The HTML is sent as `index.html` untouched; the page size and margins go as form
 *           fields in centimetres (Gotenberg takes in, pt and cm), and a roll (no height) is printed as a single page
 *           as tall as its content. The engine must hold the template's font families (an Arabic one for Arabic);
 *           that is the engine image's, not this package's. Where the engine runs is the `GotenbergEndpoint`.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2); ADR 0266 (one option, one driver); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { PdfEngine } from "#contracts/ports/pdf-engine.port";
import type { PdfPage } from "#contracts/types/pdf-page.type";
import { postGotenbergForm } from "#core/functions/post-gotenberg-form.function";
import type { GotenbergEndpoint } from "#core/types/gotenberg-endpoint.type";

/** The Chromium HTML route. */
const ROUTE = "/forms/chromium/convert/html";

/** `mm` as a Gotenberg length. */
function centimetres(mm: number): string {
  return `${mm / 10}cm`;
}

/**
 * Prints HTML through Gotenberg's Chromium.
 *
 * @example
 * const engine = new GotenbergPdfEngineDriver({ url: "http://gotenberg:3000", timeoutMs: 30_000 });
 * const pdf = await engine.print(renderHtml(resolved), resolved.template.page);
 */
export class GotenbergPdfEngineDriver extends Driver(PdfEngine) {
  /** Where the engine runs. */
  private readonly endpoint: GotenbergEndpoint;

  /**
   * @param endpoint - the engine's URL, timeout and headers (from the Connection).
   */
  constructor(endpoint: GotenbergEndpoint) {
    super();
    this.endpoint = endpoint;
  }

  /**
   * The PDF of `html` printed on `page`.
   *
   * @throws PdfEngineFailedError when the engine cannot be reached or fails to print.
   */
  print(html: string, page: PdfPage): Promise<Uint8Array> {
    const form = new FormData();
    form.append("files", new Blob([html], { type: "text/html" }), "index.html");
    form.append("paperWidth", centimetres(page.widthMm));
    if (page.heightMm === undefined) form.append("singlePage", "true");
    else form.append("paperHeight", centimetres(page.heightMm));
    for (const side of ["marginTop", "marginBottom", "marginLeft", "marginRight"])
      form.append(side, centimetres(page.marginMm));
    form.append("printBackground", "true");
    return postGotenbergForm(this.endpoint, ROUTE, form);
  }
}
