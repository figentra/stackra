/**
 * Stackra file contract:
 * Purpose: unit tests of `fieldsForInput`: fields the input lacks are dropped, nested paths keep by their top-level key,
 *          grids and steps left empty go, and a schema without a shape keeps everything.
 * Boundary: unit tier; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307.
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { fieldsForInput } from "#core/functions/fields-for-input.function";
import type { FieldNode } from "#core/types/field-node.type";

const FORM: FieldNode[] = [
  { kind: "value", key: "name" },
  { kind: "value", key: "address.city" },
  { kind: "grid", columns: 2, fields: [{ kind: "value", key: "active" }] },
  {
    kind: "steps",
    name: "setup",
    steps: [
      { name: "basics", fields: [{ kind: "value", key: "name" }] },
      { name: "status", fields: [{ kind: "value", key: "active" }] },
    ],
  },
];

describe("fieldsForInput", () => {
  it("keeps only the fields the create input takes and drops what is left empty", () => {
    const create = z.object({ name: z.string(), address: z.object({ city: z.string() }) });
    expect(fieldsForInput(FORM, create)).toEqual([
      { kind: "value", key: "name" },
      { kind: "value", key: "address.city" },
      {
        kind: "steps",
        name: "setup",
        steps: [{ name: "basics", fields: [{ kind: "value", key: "name" }] }],
      },
    ]);
  });

  it("keeps the update-only switch on Edit", () => {
    const update = z.object({ zoneId: z.string(), name: z.string(), active: z.boolean() });
    const kept = fieldsForInput(FORM, update);
    expect(kept).toContainEqual({
      kind: "grid",
      columns: 2,
      fields: [{ kind: "value", key: "active" }],
    });
    expect(kept).not.toContainEqual({ kind: "value", key: "address.city" });
  });

  it("keeps every field for a schema without a shape", () => {
    expect(fieldsForInput(FORM, undefined)).toEqual(FORM);
  });
});
