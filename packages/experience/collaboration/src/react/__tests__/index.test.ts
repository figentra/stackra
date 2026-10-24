/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: the three hooks and the Yjs binding, nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";

describe("@stackra/collaboration/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual([
      "useCursors",
      "usePresence",
      "useSharedDocument",
      "yjsReplica",
    ]);
  });
});
