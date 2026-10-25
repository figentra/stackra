/**
 * Stackra file contract:
 * Purpose: unit tests of `inlineSchemaRefs`: a local ref inlined, an unknown ref and a self-referencing ref left as
 *          written.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0155 (decision 4).
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { inlineSchemaRefs } from "#core/functions/inline-schema-refs.function";

const HOME: StackraManifest = {
  member: "tree",
  package: "@acme/tree",
  version: "1.0.0",
  schemas: {
    "tree.Node": {
      type: "object",
      properties: { children: { type: "array", items: { $ref: "#/schemas/tree.Node" } } },
    },
    "tree.Leaf": { type: "string" },
  },
};

describe("inlineSchemaRefs", () => {
  it("inlines a local ref", () => {
    expect(inlineSchemaRefs({ $ref: "#/schemas/tree.Leaf" }, HOME, [HOME])).toEqual({
      type: "string",
    });
  });

  it("leaves an unknown ref as written", () => {
    expect(inlineSchemaRefs({ $ref: "@acme/other#/schemas/x.Y" }, HOME, [HOME])).toEqual({
      $ref: "@acme/other#/schemas/x.Y",
    });
  });

  it("stops at a ref that points back into itself", () => {
    expect(inlineSchemaRefs({ $ref: "#/schemas/tree.Node" }, HOME, [HOME])).toEqual({
      type: "object",
      properties: { children: { type: "array", items: { $ref: "#/schemas/tree.Node" } } },
    });
  });
});
