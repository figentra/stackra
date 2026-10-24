/**
 * Stackra file contract:
 * Purpose: unit tests of `TranslatedType`: a value or a plain map goes in as JSON text, stored text or a parsed
 *          object comes out as a `Translated`, nulls pass through, and the column is jsonb.
 * Boundary: test only; calls the conversions directly, without an ORM.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0162 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { TranslatedType } from "#core/orm/translated.type";
import { Translated } from "#core/values/translated.value";

describe(TranslatedType, () => {
  const type = new TranslatedType();

  it("stores a value or a plain map as JSON text", () => {
    expect(type.convertToDatabaseValue(Translated.of({ en: "Shirt" }))).toBe('{"en":"Shirt"}');
    expect(type.convertToDatabaseValue({ ar: "قميص" })).toBe('{"ar":"قميص"}');
    expect(type.convertToDatabaseValue(null)).toBeNull();
    expect(() => type.convertToDatabaseValue({ en: 1 } as never)).toThrow(TypeError);
  });

  it("loads stored JSON as a Translated", () => {
    const fromText = type.convertToJSValue('{"en":"Shirt"}');
    const fromObject = type.convertToJSValue({ en: "Shirt" });
    expect(fromText).toBeInstanceOf(Translated);
    expect((fromObject as Translated).in("en")).toBe("Shirt");
    expect(type.convertToJSValue(undefined)).toBeUndefined();
  });

  it("serializes as the map in a jsonb column", () => {
    expect(type.toJSON(Translated.of({ en: "Shirt" }))).toEqual({ en: "Shirt" });
    expect(type.getColumnType()).toBe("jsonb");
    expect(type.compareAsType()).toBe("string");
  });
});
