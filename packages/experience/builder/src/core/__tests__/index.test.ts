/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the editor, the parser, the limits and the refusals are exported;
 *          the types, the hooks, the Yjs binding and the internals (`applyChange`, `blockIds`) are not.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as builder from "#core/index";

describe("@stackra/builder", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(builder).sort()).toEqual([
      "BLOCK_ID_PATTERN",
      "BLOCK_KEY_PATTERN",
      "BlockMoveInvalidError",
      "BlockNotFoundError",
      "BlockNotRegisteredError",
      "DocumentInvalidError",
      "Editor",
      "MAX_DOCUMENT_BLOCKS",
      "MAX_DOCUMENT_DEPTH",
      "RootBlockLockedError",
      "inspectorFieldsOf",
      "parseDocumentNode",
    ]);
  });

  it("keeps the contracts, the hooks, the binding and the internals out of the entry", () => {
    for (const name of [
      "EditorChangeKind",
      "useEditor",
      "useSelection",
      "useSharedEditor",
      "bindSharedDocument",
      "applyChange",
      "blockIds",
    ])
      expect(name in builder).toBe(false);
  });
});
