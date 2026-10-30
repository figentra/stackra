/**
 * Stackra file contract:
 * Purpose: unit tests of `inputKind`: a boolean, a number, an enum (with its codes), text, an object (its keys) and a
 *          list (of objects or values), through the optional, nullable and default wrappers, a nested path and a list
 *          item's numeric segment; an unknown path is text.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307.
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { inputKind } from "#core/functions/input-kind.function";

const input = z.object({
  isFrozen: z.boolean().default(false),
  points: z.number().int().optional(),
  tier: z.enum(["bronze", "gold"]).nullable(),
  note: z.string(),
  address: z.object({ zip: z.number() }),
  parcels: z.array(z.object({ weight: z.number(), kind: z.enum(["box", "tube"]) })).min(1),
  tags: z.array(z.string()).optional(),
});

describe("inputKind", () => {
  it("reads each field's control kind", () => {
    expect(inputKind(input, "isFrozen")).toEqual({ kind: "boolean" });
    expect(inputKind(input, "points")).toEqual({ kind: "number" });
    expect(inputKind(input, "tier")).toEqual({ kind: "enum", options: ["bronze", "gold"] });
    expect(inputKind(input, "note")).toEqual({ kind: "text" });
    expect(inputKind(input, "address.zip")).toEqual({ kind: "number" });
  });

  it("reads objects and lists, and a list item through a numeric segment", () => {
    expect(inputKind(input, "address")).toEqual({ kind: "object", keys: ["zip"] });
    expect(inputKind(input, "parcels")).toEqual({ kind: "list", item: "object" });
    expect(inputKind(input, "tags")).toEqual({ kind: "list", item: "value" });
    expect(inputKind(input, "parcels.0")).toEqual({ kind: "object", keys: ["weight", "kind"] });
    expect(inputKind(input, "parcels.2.weight")).toEqual({ kind: "number" });
    expect(inputKind(input, "tags.0")).toEqual({ kind: "text" });
  });

  it("answers text for a path the schema does not have", () => {
    expect(inputKind(input, "missing.path")).toEqual({ kind: "text" });
    expect(inputKind(undefined, "x")).toEqual({ kind: "text" });
  });
});
