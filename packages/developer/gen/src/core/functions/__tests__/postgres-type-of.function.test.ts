/**
 * Stackra file contract:
 * Purpose: unit tests of `postgresTypeOf`, `normalizePostgresType` and `postgresTypeAgrees`: each field kind the map
 *          covers gives its Postgres type, an unmapped kind and a rule-less number give undefined, `format_type` text
 *          shortens to the migrations' form, and the text, integer and numeric families agree with their members only.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0135; ADR 0159; STA-1808.
 */
import { describe, expect, it } from "@stackra/testing";

import { normalizePostgresType } from "#core/functions/normalize-postgres-type.function";
import { postgresTypeAgrees } from "#core/functions/postgres-type-agrees.function";
import { postgresTypeOf } from "#core/functions/postgres-type-of.function";
import type { FieldIR } from "#core/types/field-ir.type";
import type { FieldRule } from "#core/types/field-rule.type";
import type { TypeDesc } from "#core/types/type-desc.type";

/** A field of `type`, named `name`, with `rules`. */
const field = (type: TypeDesc, rules: readonly FieldRule[] = [], name = "x"): FieldIR => ({
  name,
  optional: false,
  nullable: false,
  type,
  rules,
});

describe("postgresTypeOf", () => {
  it.each<[string, FieldIR, string | undefined]>([
    ["string", field({ kind: "string" }), "text"],
    [
      "a string with a max",
      field({ kind: "string" }, [{ name: "Str", options: { max: 120 } }]),
      "text",
    ],
    ["a brand", field({ kind: "brand", brand: "email" }), "text"],
    ["an enum", field({ kind: "enum", name: "Status", values: ["a", "b"] }), "text"],
    ["a driver name", field({ kind: "driver_name", port: "Mailer", values: [] }), "text"],
    ["a public id", field({ kind: "public_id", prefix: "ord" }), "varchar(33)"],
    ["a boolean", field({ kind: "boolean" }), "boolean"],
    ["a date", field({ kind: "date" }), "timestamptz"],
    ["json", field({ kind: "json" }), "jsonb"],
    ["a record", field({ kind: "record", value: { kind: "string" } }), "jsonb"],
    ["an array", field({ kind: "array", element: { kind: "string" } }), "jsonb"],
    ["a translated text", field({ kind: "translated", form: "value" }), "jsonb"],
    ["an @Int number", field({ kind: "number" }, [{ name: "Int", options: {} }]), "integer"],
    ["a @Num number", field({ kind: "number" }, [{ name: "Num", options: {} }]), "numeric"],
    ["the version trait field", field({ kind: "number" }, [], "version"), "integer"],
    ["a number with no rule", field({ kind: "number" }), undefined],
    ["a duration", field({ kind: "duration" }), undefined],
    ["an upload", field({ kind: "upload" }), undefined],
    ["a hatch", field({ kind: "hatch", source: "z.string()" }), undefined],
  ])("maps %s", (_name, input, expected) => {
    expect(postgresTypeOf(input)).toBe(expected);
  });
});

describe("normalizePostgresType", () => {
  it.each([
    ["character varying(33)", "varchar(33)"],
    ["timestamp with time zone", "timestamptz"],
    ["character(3)", "char(3)"],
    ["numeric(12,2)", "numeric(12, 2)"],
    ["double precision", "double precision"],
    ["TEXT", "text"],
  ])("shortens %s to %s", (long, short) => {
    expect(normalizePostgresType(long)).toBe(short);
  });
});

describe("postgresTypeAgrees", () => {
  it("lets text agree with any varchar and citext, but not with a number", () => {
    expect(postgresTypeAgrees("text", "character varying(120)")).toBe(true);
    expect(postgresTypeAgrees("text", "text")).toBe(true);
    expect(postgresTypeAgrees("text", "integer")).toBe(false);
  });

  it("lets integer agree with bigint and numeric with numeric(p, s)", () => {
    expect(postgresTypeAgrees("integer", "bigint")).toBe(true);
    expect(postgresTypeAgrees("integer", "numeric(10,2)")).toBe(false);
    expect(postgresTypeAgrees("numeric", "numeric(10,2)")).toBe(true);
    expect(postgresTypeAgrees("numeric", "double precision")).toBe(true);
  });

  it("compares every other type exactly", () => {
    expect(postgresTypeAgrees("varchar(33)", "character varying(33)")).toBe(true);
    expect(postgresTypeAgrees("varchar(33)", "text")).toBe(false);
    expect(postgresTypeAgrees("timestamptz", "timestamp without time zone")).toBe(false);
    expect(postgresTypeAgrees("jsonb", "json")).toBe(false);
  });
});
