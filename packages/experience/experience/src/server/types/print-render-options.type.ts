/**
 * Stackra file contract:
 * Purpose: `PrintRenderOptions`, the node render options of a print document plus the `PdfEngine` that prints it and
 *          the page it is printed on.
 * Boundary: a type only. The engine is whichever `PdfEngine` driver the host bound (@stackra/documents, ADR 0365); the
 *           page is the document's data (a roll has no height), never a paper name.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 6); ADR 0365 (decision 2).
 */
import type { PdfEngine, PdfPage } from "@stackra/documents/contracts";

import type { ServerRenderOptions } from "#server/types/server-render-options.type";

/** The options of one print render. */
export interface PrintRenderOptions extends ServerRenderOptions {
  /** The bound PDF engine. */
  readonly engine: PdfEngine;

  /** The paper, in millimetres. */
  readonly page: PdfPage;
}
