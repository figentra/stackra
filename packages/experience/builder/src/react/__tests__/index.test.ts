/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: the three hooks and the Yjs binding are exported; the kernel,
 *          the types and the refusals stay in their own entries.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";

describe("@stackra/builder/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual([
      "bindSharedDocument",
      "useEditor",
      "useSelection",
      "useSharedEditor",
    ]);
  });

  it("keeps the kernel, the contracts and the refusals out of the entry", () => {
    for (const name of ["Editor", "EditorChangeKind", "parseDocumentNode", "DocumentInvalidError"])
      expect(name in react).toBe(false);
  });
});
