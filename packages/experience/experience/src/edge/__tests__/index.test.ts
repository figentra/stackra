/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./edge` entry: the OS edge Worker imports `renderEdgeDocument`,
 *          `EDGE_RENDER_LIMITS`, `EdgeRenderFailure` and `escapeHtml`, and the edge block types; nothing else is
 *          exported.
 * Boundary: test only; imports the stand-in barrel through its `#edge` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); ADR 0440.
 */
import { describe, expect, it } from "@stackra/testing";

import * as edge from "#edge/index";

describe("@stackra/experience/edge", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(edge).sort()).toEqual([
      "EDGE_RENDER_LIMITS",
      "EdgeRenderFailure",
      "escapeHtml",
      "renderEdgeDocument",
    ]);
  });
});
