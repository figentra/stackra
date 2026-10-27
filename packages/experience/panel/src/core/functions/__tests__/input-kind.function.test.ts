/**
 * Stackra file contract:
 * Purpose: unit tests of `inputKind`: a boolean, a number, an enum (with its codes) and text, through the optional,
 *          nullable and default wrappers and a nested path; an unknown path is text.
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
});

describe("inputKind", () => {
  it("reads each field's control kind", () => {
    expect(inputKind(input, "isFrozen")).toEqual({ kind: "boolean" });
    expect(inputKind(input, "points")).toEqual({ kind: "number" });
    expect(inputKind(input, "tier")).toEqual({ kind: "enum", options: ["bronze", "gold"] });
    expect(inputKind(input, "note")).toEqual({ kind: "text" });
    expect(inputKind(input, "address.zip")).toEqual({ kind: "number" });
  });

  it("answers text for a path the schema does not have", () => {
    expect(inputKind(input, "missing.path")).toEqual({ kind: "text" });
    expect(inputKind(undefined, "x")).toEqual({ kind: "text" });
  });
});
