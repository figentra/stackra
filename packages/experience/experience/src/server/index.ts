/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./server` entry of @stackra/experience, the node renderer of studio documents
 *          (`renderServerHtml`, `renderEmailTemplate`, `renderPrintDocument` through @stackra/documents' `PdfEngine`),
 *          the `escapeHtml` every server block writes through, and the types `ServerBlock`, `ServerBlockContext`,
 *          `ServerRenderOptions`, `PrintRenderOptions`, `RenderedEmail` and `RenderedPrint`, until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. No React: a server or job imports it.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0270 (decision 6).
 */
export { escapeHtml } from "#edge/functions/escape-html.function";
export { renderEmailTemplate } from "#server/functions/render-email-template.function";
export { renderPrintDocument } from "#server/functions/render-print-document.function";
export { renderServerHtml } from "#server/functions/render-server-html.function";
export type { PrintRenderOptions } from "#server/types/print-render-options.type";
export type { RenderedEmail } from "#server/types/rendered-email.type";
export type { RenderedPrint } from "#server/types/rendered-print.type";
export type { ServerBlock } from "#server/types/server-block.type";
export type { ServerBlockContext } from "#server/types/server-block-context.type";
export type { ServerRenderOptions } from "#server/types/server-render-options.type";
