/**
 * Stackra file contract:
 * Purpose: unit tests of `inputKind`: a boolean, a number, an enum (with its codes), text, an object (its keys), a
 *          list (of objects or values), a map of string keys, a calendar day, an instant and any JSON value, through
 *          the optional, nullable and default wrappers, a nested path and a list item's numeric segment; an unknown
 *          path is missing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307.
 */
import { describe, expect, it } from "@stackra/testing";
import { isoDateTime } from "@stackra/validation";
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
  condition: z.json(),
  evidence: z.unknown().optional(),
  fieldMap: z.record(z.string(), z.string()),
  weights: z.record(z.string(), z.number()).optional(),
  validOn: z.iso.date(),
  startsAt: isoDateTime(),
  endsAt: isoDateTime().optional(),
  sentAt: z.iso.datetime(),
  seenAt: z.date(),
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

  it("reads a JSON value, whether zod's json() or unknown", () => {
    expect(inputKind(input, "condition")).toEqual({ kind: "json" });
    expect(inputKind(input, "evidence")).toEqual({ kind: "json" });
  });

  it("reads a map of string keys with text or number values", () => {
    expect(inputKind(input, "fieldMap")).toEqual({ kind: "record", value: "text" });
    expect(inputKind(input, "weights")).toEqual({ kind: "record", value: "number" });
  });

  it("tells a calendar day from an instant", () => {
    expect(inputKind(input, "validOn")).toEqual({ kind: "date" });
    for (const path of ["startsAt", "endsAt", "sentAt", "seenAt"])
      expect(inputKind(input, path), path).toEqual({ kind: "datetime" });
  });

  it("answers missing for a path the schema does not have", () => {
    expect(inputKind(input, "missing.path")).toEqual({ kind: "missing" });
    expect(inputKind(undefined, "x")).toEqual({ kind: "missing" });
  });
});
