/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./contracts` entry of @stackra/rules: `FieldType` and `Operator` at run time, and
 *          the types `FactField`, `FactSource` and `GeoPoint` at compile time (a source with an enum field and a point
 *          typecheck; a field without a label and an abbreviated point are refused).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0331 (decisions 3, 4 and 11).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { FactField, FactSource, GeoPoint } from "#contracts/index";
import { FieldType } from "#contracts/enums/field-type.enum";
import { Operator } from "#contracts/enums/operator.enum";

describe("@stackra/rules/contracts", () => {
  it("exports exactly the two enums", () => {
    expect(Object.keys(contracts).sort()).toEqual(["FieldType", "Operator"]);
    expect(contracts.FieldType).toBe(FieldType);
    expect(contracts.Operator).toBe(Operator);
  });

  it("types a fact source and its fields", () => {
    const tier: FactField = {
      type: FieldType.Enum,
      label: "loyalty::facts.tier" as I18nKey,
      values: { gold: "loyalty::tiers.gold" as I18nKey },
    };
    const source: FactSource = { key: "customer", fields: { tier } };
    // @ts-expect-error -- a field always has a label
    const unlabelled: FactField = { type: FieldType.Number };
    expect([source, unlabelled]).toHaveLength(2);
    expectTypeOf<FactSource["fields"]>().toEqualTypeOf<Readonly<Record<string, FactField>>>();
  });

  it("types a point in whole words", () => {
    const point: GeoPoint = { latitude: 25.2, longitude: 55.27 };
    // @ts-expect-error -- latitude and longitude, never abbreviated
    const short: GeoPoint = { lat: 25.2, lng: 55.27 };
    expect([point, short]).toHaveLength(2);
  });
});
