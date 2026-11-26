/**
 * Stackra file contract:
 * Purpose: unit tests of `checkSearchableEncrypted`: a `@Searchable` text, filter, sortable or range path that ends at
 *          a field `HasEncryptedFields` names is refused (`searchable_field_encrypted`) with a fix, also through an own
 *          base model, with the trait's options argument and through a dotted path to an own model; a plain field, a
 *          model without the facet and a path that leaves the member's models pass; and `generateMember` refuses on it
 *          in the full pass.
 * Boundary: test only; pure IR in, refusals out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0465 (decision 5); ADR 0294 (decision 22); STA-2241.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkSearchableEncrypted } from "#core/functions/check-searchable-encrypted.function";
import { generateMember } from "#core/functions/generate-member.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FacetUse } from "#core/types/facet-use.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The fixture's `Order` model, the template of every model here. */
const ORDER = COMMERCE_IR.classes.find((candidate) => candidate.name === "Order") as DeclaredClass;

/** A model `name` with `facets`, the `HasEncryptedFields` arguments `encrypted` and an optional own base. */
function model(
  name: string,
  facets: readonly FacetUse[],
  encrypted?: readonly unknown[],
  base?: string,
): DeclaredClass {
  return {
    ...ORDER,
    name,
    file: `src/modules/orders/models/${name.toLowerCase()}.model.ts`,
    facets,
    traits: encrypted === undefined ? [] : [{ name: "HasEncryptedFields", args: encrypted }],
    ...(base === undefined ? {} : { base: { name: base, from: "#x", own: true } }),
  };
}

/** `@Searchable(options)` on a class. */
function searchable(options: Readonly<Record<string, unknown>>): FacetUse {
  return {
    name: "Searchable",
    kind: "searchable",
    target: "class",
    options,
    from: "@stackra/model",
  };
}

/** The member with `classes` and the model shapes `shapes`. */
function irOf(classes: readonly DeclaredClass[], shapes: readonly ShapeIR[] = []): MemberIR {
  return {
    ...COMMERCE_IR,
    classes: [...COMMERCE_IR.classes, ...classes],
    shapes: [...COMMERCE_IR.shapes, ...shapes],
  };
}

/** The subjects refused for `ir`. */
function refused(ir: MemberIR): string[] {
  return checkSearchableEncrypted(ir).map((error) => `${error.code} ${error.subject}`);
}

describe(checkSearchableEncrypted, () => {
  it("refuses an encrypted text field, with a fix", () => {
    const ir = irOf([
      model("Patient", [searchable({ text: ["displayName", "diagnosis"] })], ["diagnosis"]),
    ]);
    const [error] = checkSearchableEncrypted(ir);
    expect(refused(ir)).toEqual(["searchable_field_encrypted Patient.diagnosis"]);
    expect(error?.file).toBe("src/modules/orders/models/patient.model.ts");
    expect(error?.message).toContain("Patient keeps sealed with HasEncryptedFields");
    expect(error?.fix).toContain(
      "drop diagnosis from the facet's text, filters, sortable and ranges",
    );
    expect(error?.fix).toContain('HasEncryptedFields({ lookup: ["diagnosis"] })');
  });

  it("refuses an encrypted filter, sortable or range path once each, after the trait's options", () => {
    const ir = irOf([
      model(
        "Patient",
        [
          searchable({
            text: ["displayName"],
            filters: ["nationalId", "status"],
            sortable: ["birthDate", "nationalId"],
            ranges: ["weight"],
          }),
        ],
        [{ lookup: ["nationalId"] }, "nationalId", "birthDate", "weight"],
      ),
    ]);
    expect(refused(ir)).toEqual([
      "searchable_field_encrypted Patient.nationalId",
      "searchable_field_encrypted Patient.birthDate",
      "searchable_field_encrypted Patient.weight",
    ]);
  });

  it("passes plain fields, an encrypted model without the facet and a facet on a plain model", () => {
    expect(
      refused(
        irOf([
          model(
            "Patient",
            [searchable({ text: ["displayName"], filters: ["status"] })],
            ["diagnosis"],
          ),
          model("Vault", [], ["secret"]),
          model("Memo", [searchable({ text: ["diagnosis"] })]),
        ]),
      ),
    ).toEqual([]);
  });

  it("reads a field an own base model encrypts", () => {
    const ir = irOf([
      model("BasePatient", [], ["diagnosis"]),
      model("Outpatient", [searchable({ text: ["diagnosis"] })], undefined, "BasePatient"),
    ]);
    expect(refused(ir)).toEqual(["searchable_field_encrypted Outpatient.diagnosis"]);
  });

  it("follows a dotted path through a relation to an own model, and passes one that leaves the member", () => {
    const shape = COMMERCE_IR.shapes[0] as ShapeIR;
    const ir = irOf(
      [
        model("Allergy", [], ["reaction"]),
        model("Patient", [searchable({ text: ["allergies.reaction", "insurer.reaction"] })]),
      ],
      [
        {
          ...shape,
          name: "Patient",
          kind: "model",
          entity: {
            optional: [],
            computed: [],
            relations: [
              {
                name: "allergies",
                kind: "m:1",
                target: { name: "Allergy", from: "#modules/orders/models/allergy.model" },
                nullable: false,
                ref: false,
                options: {},
              },
            ],
          },
        },
      ],
    );
    expect(refused(ir)).toEqual(["searchable_field_encrypted Patient.allergies.reaction"]);
  });

  it("makes generateMember refuse in the full pass", () => {
    const ir = irOf([model("Patient", [searchable({ text: ["diagnosis"] })], ["diagnosis"])]);
    const result = generateMember(ir);
    expect(result.files).toEqual([]);
    expect(result.errors.map((error) => error.code)).toContain("searchable_field_encrypted");
  });
});
