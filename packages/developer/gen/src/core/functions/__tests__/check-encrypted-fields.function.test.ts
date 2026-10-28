/**
 * Stackra file contract:
 * Purpose: unit tests of `checkEncryptedFields`: an encrypted field must exist and carry `@Classified`, and a native,
 *          query-builder or raw SQL write on an encrypted model (own or a declared package's, by class or table) is
 *          refused; a model without `HasEncryptedFields` is left alone.
 * Boundary: test only; runs on the commerce IR fixture with the first model made encrypted.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0465 (decision 5); ADR 0134 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkEncryptedFields } from "#core/functions/check-encrypted-fields.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

const MODEL = COMMERCE_IR.classes.find((declared) => declared.kind === "model") as DeclaredClass;
const SHAPE = COMMERCE_IR.shapes.find((shape) => shape.name === MODEL.name) as ShapeIR;
const FIELD = SHAPE.fields[0]?.name ?? "";

/** The fixture with the first model encrypting `fields`, the first field classified when `classified` is set. */
const encrypted = (
  fields: readonly string[],
  classified?: string,
  extra: Partial<MemberIR> = {},
): MemberIR => ({
  ...COMMERCE_IR,
  classes: COMMERCE_IR.classes.map((declared) =>
    declared === MODEL
      ? { ...declared, traits: [...declared.traits, { name: "HasEncryptedFields", args: fields }] }
      : declared,
  ),
  shapes: COMMERCE_IR.shapes.map((shape) =>
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

const write = (method: string, target: string): NonNullable<MemberIR["nativeWrites"]>[number] => ({
  file: "src/modules/orders/services/x.service.ts",
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
      ...COMMERCE_IR,
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
      checkEncryptedFields({ ...COMMERCE_IR, nativeWrites: [write("nativeUpdate", MODEL.name)] }),
    ).toEqual([]);
  });
});
