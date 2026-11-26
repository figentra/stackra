/**
 * Stackra file contract:
 * Purpose: unit tests of `checkShownOnce`: an idempotent action whose output has a secret-named field that is neither
 *          `@ShownOnce` nor `@Hidden` warns (`secret_output_kept`); the marker, `@Hidden`, `Idempotency.Never` or an
 *          ordinary field name pass.
 * Boundary: test only; runs on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0136 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { checkShownOnce } from "#core/functions/check-shown-once.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { MemberIR } from "#core/types/member-ir.type";

const ACTION = COMMERCE_IR.classes.find(
  (declared) => declared.name === "CancelOrderAction",
) as DeclaredClass;

/** The fixture with the action's options changed and `field` added to its output shape. */
function withOutputField(
  field: Partial<FieldIR> & { name: string },
  options: Readonly<Record<string, unknown>> = ACTION.options,
): MemberIR {
  return {
    ...COMMERCE_IR,
    classes: COMMERCE_IR.classes.map((declared) =>
      declared === ACTION ? { ...declared, options } : declared,
    ),
    shapes: COMMERCE_IR.shapes.map((shape) =>
      shape.name === ACTION.handle?.output
        ? {
            ...shape,
            fields: [
              ...shape.fields,
              {
                optional: false,
                nullable: false,
                type: { kind: "string" },
                rules: [],
                ...field,
              } as FieldIR,
            ],
          }
        : shape,
    ),
  };
}

describe("checkShownOnce", () => {
  it("passes the fixture", () => {
    expect(checkShownOnce(COMMERCE_IR)).toEqual([]);
  });

  it.each([["signingSecret"], ["apiKey"], ["clientSecret"], ["accessToken"], ["password"]])(
    "warns on an unmarked %s",
    (name) => {
      const [warning] = checkShownOnce(withOutputField({ name }));
      expect(warning).toMatchObject({
        code: "secret_output_kept",
        severity: "warning",
        subject: "CancelOrderAction",
      });
      expect(warning?.message).toContain(`CancelOrderOutput.${name}`);
    },
  );

  it("passes a marked, hidden or never-stored secret, and an ordinary name", () => {
    expect(checkShownOnce(withOutputField({ name: "signingSecret", shownOnce: true }))).toEqual([]);
    expect(checkShownOnce(withOutputField({ name: "signingSecret", hidden: true }))).toEqual([]);
    expect(
      checkShownOnce(
        withOutputField({ name: "signingSecret" }, { ...ACTION.options, idempotency: "never" }),
      ),
    ).toEqual([]);
    expect(checkShownOnce(withOutputField({ name: "secretOmitted" }))).toEqual([]);
    expect(checkShownOnce(withOutputField({ name: "tokenCount" }))).toEqual([]);
  });
});
