/**
 * Stackra file contract:
 * Purpose: unit tests of the `Renderer` port: a port a target's driver implements and a class token, rendering with
 *          the context's locale and handlers.
 * Boundary: test only; the driver is a hand-rolled one that renders a document's block keys as text.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0112 (X9); ADR 0294 (decision 4).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Renderer } from "#contracts/ports/renderer.port";
import type { DocumentNode } from "#contracts/types/document-node.type";
import type { RenderContext } from "#contracts/types/render-context.type";

describe("Renderer", () => {
  it("is a port a target's driver implements", () => {
    class TextRenderer extends Renderer {
      render(document: unknown, context: RenderContext): string {
        const nodes = [document].flat() as DocumentNode[];
        return `${context.locale}: ${nodes.map((node) => node.block).join(", ")}`;
      }
    }
    const renderer = new TextRenderer();
    const document: DocumentNode[] = [{ block: "web.hero_section" }, { block: "web.cta_banner" }];
    expect(renderer.render(document, { locale: "ar" })).toBe(
      "ar: web.hero_section, web.cta_banner",
    );
    expect(renderer).toBeInstanceOf(Renderer);
    expect(renderer).toBeInstanceOf(Port);
  });
});
