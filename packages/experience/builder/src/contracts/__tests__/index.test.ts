/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: `EditorChangeKind` and `InspectorFieldKind` are its values, and its types keep
 *          their shapes (an `EditorNode` is an experience `DocumentNode`).
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { AnyClass } from "@stackra/container";
import type { DocumentNode } from "@stackra/experience/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  EditorChange,
  EditorNode,
  EditorOptions,
  EditorState,
  Inspector,
  InspectorField,
} from "#contracts/index";

describe("@stackra/builder/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["EditorChangeKind", "InspectorFieldKind"]);
  });

  it("keeps the kernel out of the leaf entry", () => {
    for (const name of ["Editor", "parseDocumentNode", "useEditor", "bindSharedDocument"])
      expect(name in contracts).toBe(false);
  });

  it("types an editor node as an experience document node with an id", () => {
    expectTypeOf<EditorNode>().toExtend<DocumentNode>();
    expectTypeOf<EditorNode["id"]>().toEqualTypeOf<string>();
    expectTypeOf<EditorNode["children"]>().toEqualTypeOf<readonly EditorNode[]>();
  });

  it("types the inspector and its field descriptors", () => {
    expectTypeOf<InspectorField["kind"]>().toEqualTypeOf<
      "text" | "number" | "boolean" | "enum" | "money" | "localized"
    >();
    expectTypeOf<InspectorField["options"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<Inspector["fields"]>().toEqualTypeOf<readonly InspectorField[]>();
  });

  it("types the options, the state and the changes", () => {
    expectTypeOf<EditorOptions["root"]>().toEqualTypeOf<DocumentNode>();
    expectTypeOf<EditorOptions["blocks"]>().toEqualTypeOf<ReadonlyMap<string, AnyClass>>();
    expectTypeOf<EditorState["selection"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<EditorChange["kind"]>().toEqualTypeOf<"insert" | "remove" | "move" | "set_prop">();
  });
});
