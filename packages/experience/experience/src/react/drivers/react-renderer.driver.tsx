/**
 * Stackra file contract:
 * Purpose: `ReactRendererDriver` (`react`), the `Renderer` driver of the web target: it checks the document with
 *          `resolveDocument` and draws each node with the component registered for its key on the web.
 * Boundary: all or nothing: an unknown key or refused props throws before any element exists, so the route's error
 *           boundary shows instead of a partial page. Nothing in a document is evaluated: props reach components as
 *           data (ADR 0110 decision 4, ADR 0112 X7).
 * Runtime: browser
 * Governing contract: ADR 0110 (decisions 4 and 6); ADR 0112 (X5, X9); ADR 0294 (decision 17); ADR 0263.
 */
import { Driver } from "@stackra/container";
import type { ReactNode } from "react";

import { Renderer } from "#contracts/ports/renderer.port";
import type { RenderContext } from "#contracts/types/render-context.type";
import { resolveDocument } from "#core/functions/resolve-document.function";
import { BlockNode } from "#react/block-node/block-node";

/**
 * Documents on the web.
 *
 * @example
 * // generated wiring, web target
 * { port: Renderer, candidates: { react: () => import("@stackra/experience/react").then((m) => m.ReactRendererDriver) } }
 */
export class ReactRendererDriver extends Driver(Renderer) {
  /**
   * The elements of `document`, or `null` for an empty one.
   *
   * @throws UnknownBlockError when a node names a block not registered on the web.
   * @throws InvalidDocumentError when the document is malformed or a node's props break its block's schema.
   */
  render(document: unknown, context: RenderContext): ReactNode {
    const nodes = resolveDocument(document, context.locale);
    if (nodes.length === 0) return null;
    return (
      <>
        {nodes.map((node) => (
          <BlockNode key={node.path} node={node} context={context} />
        ))}
      </>
    );
  }
}
