/**
 * Stackra file contract:
 * Purpose: unit tests of `CapturesChanges` and `changeCaptureOf`: the options are recorded with values off by default,
 *          the dropped fields join `exclude`, the encrypted fields and the `@Classified` ones, a model without the trait
 *          has no capture, and an exclude naming a field twice is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); data-layer gaps cdc1 and cdc2.
 */
import { DataClassification } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { Classified } from "@stackra/validation";

import { Model } from "#core/bases/model.base";
import { changeCaptureOf } from "#core/functions/change-capture-of.function";
import { traitsOf } from "#core/functions/traits-of.function";
import { CapturesChanges } from "#core/traits/captures-changes.trait";
import { HasEncryptedFields } from "#core/traits/has-encrypted-fields.trait";

class Contact extends Model.with(
  HasEncryptedFields("phone"),
  CapturesChanges({ values: true, exclude: ["cost"] }),
) {
  @Classified(DataClassification.Personal)
  email = "";

  phone = "";

  cost = 0;

  name = "";
}

class Note extends Model.with(CapturesChanges()) {}

class Plain extends Model {}

describe("CapturesChanges", () => {
  it("records its options with values off by default", () => {
    expect(traitsOf(Note)[0]?.options).toEqual({ values: false, exclude: [] });
    expect(changeCaptureOf(Note)).toEqual({ values: false, dropped: new Set() });
  });

  it("drops the excluded, encrypted and classified fields", () => {
    const capture = changeCaptureOf(Contact);
    expect(capture?.values).toBe(true);
    expect([...(capture?.dropped ?? [])].sort()).toEqual(["cost", "email", "phone"]);
  });

  it("has no capture for a model without the trait", () => {
    expect(changeCaptureOf(Plain)).toBeUndefined();
  });

  it("refuses an exclude that names a field twice", () => {
    expect(() => CapturesChanges({ exclude: ["a", "a"] })).toThrow(TypeError);
  });
});
