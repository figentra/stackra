/**
 * Stackra file contract:
 * Purpose: unit tests of `checkBlindIndexes`: a `lookup` field must be encrypted, never combined with `subject`, and
 *          have a declared, indexed `<field>Bidx: string | null`; a model without `lookup` is left alone.
 * Boundary: test only; runs on the billing IR fixture with its first model made encrypted.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0465 (decision 5); data-layer gap gov9 (STA-1482).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkBlindIndexes } from "#core/functions/check-blind-indexes.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

const MODEL = BILLING_IR.classes.find((declared) => declared.kind === "model") as DeclaredClass;
const SHAPE = BILLING_IR.shapes.find((shape) => shape.name === MODEL.name) as ShapeIR;
const FIELD = SHAPE.fields[0]?.name ?? "";
const INDEX = `${FIELD}Bidx`;

/** The `<field>Bidx: string | null` property. */
const BIDX = {
  ...SHAPE.fields[0],
  name: INDEX,
  type: { kind: "string" },
  nullable: true,
} as FieldIR;

/** The fixture with the first model encrypting `FIELD` under `options`, with the index property and `@Index` as set. */
const model = (
  options: Readonly<Record<string, unknown>>,
  { declared = true, indexed = true }: { declared?: boolean; indexed?: boolean } = {},
): MemberIR => ({
  ...BILLING_IR,
  classes: BILLING_IR.classes.map((each) =>
    each === MODEL
      ? {
          ...each,
          traits: [...each.traits, { name: "HasEncryptedFields", args: [options, FIELD] }],
          facets: indexed
            ? [
                ...each.facets,
                {
                  name: "Index",
                  kind: "index",
                  target: "class",
                  options: [INDEX],
                  from: "@stackra/model",
                },
              ]
            : each.facets,
        }
      : each,
  ),
  shapes: BILLING_IR.shapes.map((shape) =>
    shape === SHAPE && declared ? { ...shape, fields: [...shape.fields, BIDX] } : shape,
  ),
});

const codes = (ir: MemberIR): string[] => checkBlindIndexes(ir).map((error) => error.code);

describe("checkBlindIndexes", () => {
  it("accepts a lookup field with a declared, indexed blind index", () => {
    expect(codes(model({ lookup: [FIELD] }))).toEqual([]);
  });

  it("leaves a model without lookup alone", () => {
    expect(codes(model({}, { declared: false, indexed: false }))).toEqual([]);
    expect(codes(BILLING_IR)).toEqual([]);
  });

  it("refuses a lookup field the trait does not encrypt", () => {
    expect(codes(model({ lookup: [FIELD, "nowhere"] }))).toEqual(["encrypted_lookup_unknown"]);
  });

  it("refuses lookup with subject", () => {
    expect(codes(model({ lookup: [FIELD], subject: "ownerId" }))).toEqual([
      "encrypted_lookup_subject",
    ]);
  });

  it("refuses a missing blind index property and a missing index", () => {
    const refusals = checkBlindIndexes(
      model({ lookup: [FIELD] }, { declared: false, indexed: false }),
    );
    expect(refusals.map((error) => error.code)).toEqual([
      "encrypted_lookup_undeclared",
      "encrypted_lookup_not_indexed",
    ]);
    expect(refusals[0]?.subject).toBe(`${MODEL.name}.${INDEX}`);
  });
});
