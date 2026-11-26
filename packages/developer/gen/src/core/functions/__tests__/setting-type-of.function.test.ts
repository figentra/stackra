/**
 * Stackra file contract:
 * Purpose: unit tests of `settingTypeOf`: each type a setting holds (boolean, integer, number, string, brand,
 *          connection id, choice from an enum or a driver name, list of strings or of an enum) and the types it does
 *          not (json, money, date, a record, a schema, a non-connection id, an array of numbers).
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 22 and 23); STA-2056.
 */
import { describe, expect, it } from "@stackra/testing";

import { settingTypeOf } from "#core/functions/setting-type-of.function";
import type { FieldIR } from "#core/types/field-ir.type";

/** A field of `type`. */
const field = (type: FieldIR["type"], rules: FieldIR["rules"] = []): FieldIR => ({
  name: "x",
  optional: false,
  nullable: false,
  type,
  rules,
});

const MODE = { kind: "enum", name: "OrderMode", values: ["open", "closed"] } as const;

describe("settingTypeOf", () => {
  it("maps the scalar types", () => {
    expect(settingTypeOf(field({ kind: "boolean" }))).toEqual({ type: "boolean" });
    expect(settingTypeOf(field({ kind: "number" }))).toEqual({ type: "number" });
    expect(settingTypeOf(field({ kind: "number" }, [{ name: "Int", options: {} }]))).toEqual({
      type: "integer",
    });
    expect(settingTypeOf(field({ kind: "string" }))).toEqual({ type: "string" });
    expect(settingTypeOf(field({ kind: "brand", brand: "url" }))).toEqual({ type: "string" });
    expect(settingTypeOf(field({ kind: "public_id", prefix: "conn" }))).toEqual({
      type: "connection",
    });
  });

  it("maps an enum and a driver name to a choice with its options in order", () => {
    expect(settingTypeOf(field(MODE))).toEqual({ type: "choice", options: ["open", "closed"] });
    expect(
      settingTypeOf(field({ kind: "driver_name", port: "Signer", values: ["hmac", "rsa"] })),
    ).toEqual({ type: "choice", options: ["hmac", "rsa"] });
  });

  it("maps an array of strings to a list and an array of an enum to a list with options", () => {
    expect(settingTypeOf(field({ kind: "array", element: { kind: "string" } }))).toEqual({
      type: "list",
    });
    expect(
      settingTypeOf(field({ kind: "array", element: { kind: "brand", brand: "email" } })),
    ).toEqual({ type: "list" });
    expect(settingTypeOf(field({ kind: "array", element: MODE }))).toEqual({
      type: "list",
      options: ["open", "closed"],
    });
  });

  it("holds nothing else", () => {
    for (const type of [
      { kind: "json" },
      { kind: "money" },
      { kind: "date" },
      { kind: "record", value: { kind: "string" } },
      { kind: "schema", name: "Section", module: "orders" },
      { kind: "public_id", prefix: "usr" },
      { kind: "array", element: { kind: "number" } },
      { kind: "array", element: { kind: "boolean" } },
      { kind: "array", element: { kind: "array", element: { kind: "string" } } },
    ] as const)
      expect(settingTypeOf(field(type))).toBeUndefined();
  });
});
