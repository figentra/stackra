/**
 * Stackra file contract:
 * Purpose: unit tests of `checkEncryptedFields`: an encrypted field must exist and carry a data class (`@Classified`
 *          or `@Classify`), a field whose class rests sealed must be encrypted (subject-keyed when the class says
 *          `subject_sealed`), and a native, query-builder or raw SQL write on an encrypted model (own or a declared
 *          package's, by class or table) is refused; a model without `HasEncryptedFields` is left alone.
 * Boundary: test only; runs on the billing IR fixture (its models have shapes) with the first model made encrypted.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0465 (decision 5); ADR 0134 (decision 2); ADR 0540 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkEncryptedFields } from "#core/functions/check-encrypted-fields.function";
import { DATA_CLASS_IR } from "#core/__tests__/fixtures/data-class-ir.fixture";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

const { CLINICAL_NOTE, classify, field: fieldIr, irOf, model, shapeOf } = DATA_CLASS_IR;

const MODEL = BILLING_IR.classes.find((declared) => declared.kind === "model") as DeclaredClass;
const SHAPE = BILLING_IR.shapes.find((shape) => shape.name === MODEL.name) as ShapeIR;
const FIELD = SHAPE.fields[0]?.name ?? "";

/** The fixture with the first model encrypting `fields`, the first field classified when `classified` is set. */
const encrypted = (
  fields: readonly string[],
  classified?: string,
  extra: Partial<MemberIR> = {},
): MemberIR => ({
  ...BILLING_IR,
  classes: BILLING_IR.classes.map((declared) =>
    declared === MODEL
      ? { ...declared, traits: [...declared.traits, { name: "HasEncryptedFields", args: fields }] }
      : declared,
  ),
  shapes: BILLING_IR.shapes.map((shape) =>
    shape === SHAPE && classified !== undefined
      ? {
          ...shape,
          fields: shape.fields.map((field, index) =>
            index === 0 ? { ...field, classified } : field,
          ),
        }
      : shape,
  ),
  ...extra,
});

/** The encryption refusals of a `Visit` whose `note` is a clinical note, under `traits`. */
function visitCodes(traits: Parameters<typeof model>[1]): string[] {
  const visit = model("Visit", traits, [classify("note", CLINICAL_NOTE)]);
  return checkEncryptedFields(irOf([visit], [shapeOf(visit, [fieldIr("note")])])).map(
    (error) => error.code,
  );
}

const write = (method: string, target: string): NonNullable<MemberIR["nativeWrites"]>[number] => ({
  file: "src/modules/billing/services/x.service.ts",
  line: 3,
  column: 5,
  method,
  target,
});

describe("checkEncryptedFields", () => {
  it("accepts a classified encrypted field written through the unit of work", () => {
    expect(checkEncryptedFields(encrypted([FIELD], "personal"))).toEqual([]);
  });

  it("refuses an encrypted field with no @Classified class", () => {
    expect(checkEncryptedFields(encrypted([FIELD])).map((error) => error.code)).toEqual([
      "encrypted_field_unclassified",
    ]);
  });

  it("refuses a credential field that is not encrypted, and accepts one that is (ADR 0494)", () => {
    expect(checkEncryptedFields(encrypted([], "credential")).map((error) => error.code)).toEqual([
      "credential_field_not_encrypted",
    ]);
    expect(checkEncryptedFields(encrypted([FIELD], "credential"))).toEqual([]);
  });

  it("refuses a field whose data class rests sealed when HasEncryptedFields does not name it", () => {
    expect(checkEncryptedFields(encrypted([], "health")).map((error) => error.code)).toEqual([
      "classified_field_not_encrypted",
    ]);
    expect(checkEncryptedFields(encrypted([FIELD], "health"))).toEqual([]);
  });

  it("refuses a subject_sealed field sealed without a subject, and accepts it subject-keyed", () => {
    expect(visitCodes([])).toEqual(["classified_field_not_encrypted"]);
    expect(visitCodes([{ name: "HasEncryptedFields", args: ["note"] }])).toEqual([
      "classified_field_not_subject_sealed",
    ]);
    expect(
      visitCodes([{ name: "HasEncryptedFields", args: [{ subject: "userId" }, "note"] }]),
    ).toEqual([]);
  });

  it("counts a @Classify class as the encrypted field's classification", () => {
    const visit = model(
      "Visit",
      [{ name: "HasEncryptedFields", args: [{ subject: "userId" }, "note"] }],
      [classify("note", { key: "note" })],
    );
    expect(checkEncryptedFields(irOf([visit], [shapeOf(visit, [fieldIr("note")])]))).toEqual([]);
  });

  it("refuses an encrypted field the model does not declare", () => {
    expect(
      checkEncryptedFields(encrypted([FIELD, "nowhere"], "personal")).map((error) => error.code),
    ).toEqual(["encrypted_field_unknown"]);
  });

  it("refuses native, builder and raw writes on an encrypted model", () => {
    const ir = encrypted([FIELD], "personal", {
      nativeWrites: [
        write("nativeUpdate", MODEL.name),
        write("update", MODEL.name),
        write("insert", "Other"),
      ],
    });
    expect(checkEncryptedFields(ir).map((error) => error.subject)).toEqual([
      MODEL.name,
      MODEL.name,
    ]);
  });

  it("refuses a raw write on a declared package's encrypted table, with or without its schema", () => {
    const ir: MemberIR = {
      ...BILLING_IR,
      dependencies: [
        {
          package: "@acme/crm-kit",
          manifest: {
            models: [
              {
                key: "crm.contact",
                class: "Contact",
                table: "crm.contacts",
                publicId: "con",
                traits: ["HasEncryptedFields"],
              },
            ],
          } as unknown as MemberIR["dependencies"][number]["manifest"],
        },
      ],
      nativeWrites: [
        write("sql", "crm.contacts"),
        write("sql", "contacts"),
        write("nativeInsert", "Contact"),
      ],
    };
    expect(checkEncryptedFields(ir).map((error) => error.code)).toEqual([
      "encrypted_native_write",
      "encrypted_native_write",
      "encrypted_native_write",
    ]);
  });

  it("leaves a model without HasEncryptedFields alone", () => {
    expect(
      checkEncryptedFields({ ...BILLING_IR, nativeWrites: [write("nativeUpdate", MODEL.name)] }),
    ).toEqual([]);
  });
});
