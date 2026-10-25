/**
 * Stackra file contract:
 * Purpose: `NativeRendererDriver` (`native`), the `Renderer` driver of the iOS and Android targets: it checks the
 *          document with `resolveDocument` and draws each node with the component registered for its key on native
 *          (`<name>.native.tsx`).
 * Boundary: all or nothing, as on the web: an unknown key or refused props throws before any element exists. Nothing
 *           in a document is evaluated.
 * Runtime: react-native
 * Governing contract: ADR 0110 (decisions 4 and 6); ADR 0112 (X5, X9); ADR 0294 (decision 17); ADR 0263.
 */
import { Driver } from "@stackra/container";
import type { ReactNode } from "react";

import { Renderer } from "#contracts/ports/renderer.port";
import type { RenderContext } from "#contracts/types/render-context.type";
import { resolveDocument } from "#core/functions/resolve-document.function";
import { BlockNode } from "#native/block-node/block-node";

/**
 * Documents on a phone.
 *
 * @example
 * // generated wiring, native targets
 * { port: Renderer, candidates: { native: () => import("@stackra/experience/native").then((m) => m.NativeRendererDriver) } }
 */
export class NativeRendererDriver extends Driver(Renderer) {
  /**
   * The elements of `document`, or `null` for an empty one.
   *
   * @throws UnknownBlockError when a node names a block not registered on native.
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
