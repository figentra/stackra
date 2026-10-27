/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: `classComponents` (which the template's generated Vite config
 *          imports from `@stackra/gen/node`) and the registry row's discovery (with the consumed services' manifests), generate run
 *          and compiler, and the graph steps of ADR 0452 (`writeRepoGraph`, `mergeSystemGraphs`) are exported, nothing
 *          else is.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); registry v3.1 A14.
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/gen/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "classComponents",
      "classComponentsPlugin",
      "compileClassComponents",
      "discoverMember",
      "generate",
      "generateDocsSite",
      "mergeSystemGraphs",
      "openHost",
      "readServiceManifests",
      "watchDocsSite",
      "writeRepoGraph",
    ]);
  });
});
