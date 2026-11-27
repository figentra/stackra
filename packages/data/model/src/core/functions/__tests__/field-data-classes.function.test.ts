/**
 * Stackra file contract:
 * Purpose: unit tests of `builtInDataClass`, `fieldDataClasses` and `maskOf`: a `@Classified` field carries the
 *          contracts table's row, a `@Classify` field its class, a field with both the stricter code per effect under
 *          the `@Classify` key, and each field's mask method follows.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0540 (decisions 2 and 4).
 */
import { DATA_CLASSIFICATION_EFFECTS, DataClassification } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { Classified } from "@stackra/validation";

import { CredentialDataClass } from "#core/access/credential.data-class";
import { PrivilegedDataClass } from "#core/access/privileged.data-class";
import { Model } from "#core/bases/model.base";
import { Classify } from "#core/decorators/classify.decorator";
import { builtInDataClass } from "#core/functions/built-in-data-class.function";
import { fieldDataClasses } from "#core/functions/field-data-classes.function";
import { maskOf } from "#core/functions/mask-of.function";
import { HasPublicId } from "#core/traits/has-public-id.trait";

class Patient extends Model.with(HasPublicId("pat")) {
  @Classified(DataClassification.Personal)
  name!: string;

  @Classified(DataClassification.Health)
  diagnosis!: string;

  @Classify(PrivilegedDataClass)
  advice!: string;

  // Privileged on its own keeps the value out of erasure; a health classification makes it erasable and sealed.
  @Classify(PrivilegedDataClass)
  @Classified(DataClassification.Health)
  clinicalNote!: string;

  @Classify(CredentialDataClass)
  @Classified(DataClassification.Credential)
  portalToken!: string;

  notes!: string;
}

describe(builtInDataClass, () => {
  it("is the contracts row under the classification's key, frozen and made once", () => {
    const health = builtInDataClass(DataClassification.Health);
    expect(health).toEqual({ key: "health", ...DATA_CLASSIFICATION_EFFECTS.health });
    expect(Object.isFrozen(health)).toBe(true);
    expect(builtInDataClass(DataClassification.Health)).toBe(health);
  });

  it("refuses a code that is not a classification", () => {
    expect(() => builtInDataClass("secret" as DataClassification)).toThrow(RangeError);
  });
});

describe(fieldDataClasses, () => {
  const classes = fieldDataClasses(Patient);

  it("gives each classified field one class and leaves an unclassified field out", () => {
    expect([...classes.keys()].sort()).toEqual([
      "advice",
      "clinicalNote",
      "diagnosis",
      "name",
      "portalToken",
    ]);
    expect(classes.get("name")).toBe(builtInDataClass(DataClassification.Personal));
    expect(classes.get("advice")).toBe(PrivilegedDataClass.dataClass);
  });

  it("takes the stricter code of each effect for a field with both decorators, under the @Classify key", () => {
    expect(classes.get("clinicalNote")).toEqual({
      key: "privileged",
      ai: "tenant_opt_in",
      support: "hidden",
      search: "no_snippet",
      export: "labelled",
      encrypt: "sealed",
      erasure: "anonymise",
      retention: "required",
      mask: "null",
    });
    expect(classes.get("portalToken")).toEqual(CredentialDataClass.dataClass);
  });
});

describe(maskOf, () => {
  it("gives each classified field its class's mask method", () => {
    expect(Object.fromEntries(maskOf(Patient))).toEqual({
      name: "fake",
      diagnosis: "null",
      advice: "null",
      clinicalNote: "null",
      portalToken: "null",
    });
  });
});
