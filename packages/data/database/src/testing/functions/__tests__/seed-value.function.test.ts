/**
 * Stackra file contract:
 * Purpose: unit tests of `seedValue`: a fresh value cast to the key's type for a UUID, string, number or instant, and
 *          none for any other type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0347 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { seedValue } from "#testing/functions/seed-value.function";

describe("seedValue", () => {
  it("gives a fresh value cast to the key's type", () => {
    expect(seedValue({ type: "uuid", category: "U", typeName: "uuid" })).toBe("gen_random_uuid()");
    expect(seedValue({ type: "character varying(33)", category: "S", typeName: "varchar" })).toBe(
      "md5(random()::text)::character varying(33)",
    );
    expect(seedValue({ type: "bigint", category: "N", typeName: "int8" })).toBe(
      "floor(random() * 1000000)::bigint",
    );
    expect(
      seedValue({ type: "timestamp with time zone", category: "D", typeName: "timestamptz" }),
    ).toBe("clock_timestamp()::timestamp with time zone");
  });

  it("gives none for another type", () => {
    expect(seedValue({ type: "inet", category: "I", typeName: "inet" })).toBeUndefined();
    expect(seedValue({ type: "jsonb", category: "U", typeName: "jsonb" })).toBeUndefined();
  });
});
