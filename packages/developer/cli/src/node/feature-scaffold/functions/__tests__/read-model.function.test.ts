/**
 * Stackra file contract:
 * Purpose: unit tests of `readModel`: the class, prefix, plain fields (with their docs, single- and multi-line
 *          decorators and nullability) and decorator imports of a model file; a relation and a field of another type
 *          left out; a file with no `HasPublicId` refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (rule R4).
 */
import { describe, expect, it } from "@stackra/testing";

import { readModel } from "#node/feature-scaffold/functions/read-model.function";

const MODEL = `import type { PublicId } from "@stackra/contracts";
import { BelongsTo, HasPublicId, Model, Timestamps } from "@stackra/model";
import { Int, Str } from "@stackra/validation";

import { Customer } from "#modules/orders/models/customer.model";

/** An order. */
export class Order extends Model.with(HasPublicId("ord"), Timestamps) {
  /** The order's reference,
   * shown on the receipt. */
  @Str({
    min: 3,
    max: 20,
  })
  reference!: string;

  /** How many lines. */
  @Int
  lines!: number;

  note!: string | null;

  /** The buyer. */
  @BelongsTo(() => Customer)
  customer!: Customer;

  /** The customer's id. */
  customerId!: PublicId<"cus">;
}
`;

describe(readModel, () => {
  it("reads the class, prefix, plain fields and decorator imports", () => {
    const facts = readModel(MODEL, "order.model.ts");

    expect(facts.className).toBe("Order");
    expect(facts.prefix).toBe("ord");
    expect(facts.fields).toEqual([
      {
        name: "reference",
        column: "reference",
        type: "string",
        nullable: false,
        decorators: ["@Str({\n  min: 3,\n  max: 20,\n})"],
        doc: "The order's reference, shown on the receipt.",
      },
      {
        name: "lines",
        column: "lines",
        type: "number",
        nullable: false,
        decorators: ["@Int"],
        doc: "How many lines.",
      },
      {
        name: "note",
        column: "note",
        type: "string",
        nullable: true,
        decorators: [],
        doc: "The note.",
      },
    ]);
    expect(facts.imports.get("Str")).toBe("@stackra/validation");
    expect(facts.imports.get("BelongsTo")).toBe("@stackra/model");
  });

  it("refuses a model with no public id", () => {
    expect(() => readModel("export class Order extends Model {}\n", "order.model.ts")).toThrow(
      'order.model.ts exports no model with HasPublicId("<prefix>")',
    );
  });
});
