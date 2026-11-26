/**
 * Stackra file contract:
 * Purpose: `DEPRECATED_COMMERCE_IR`, the commerce service of `COMMERCE_IR` (at 1.2.0) after it deprecates things: the
 *          `CancelOrderAction` (replaced by `orders.order.cancel@2`), the `OrderPaid` event, the `OrderView.note` field
 *          (a date-versioned public field) and a `Discontinued` trait, each as `@Deprecated` or `createTrait`'s option
 *          records it. The deprecation tests and the manifest, OpenAPI and client tests run on it.
 * Boundary: test data only; never imported by package code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0131 (decision 4); STA-2836.
 */
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import type { MemberIR } from "#core/types/member-ir.type";

/** The commerce service with four deprecations. */
export const DEPRECATED_COMMERCE_IR: MemberIR = {
  ...COMMERCE_IR,
  classes: COMMERCE_IR.classes.map((declared) =>
    declared.name === "CancelOrderAction"
      ? {
          ...declared,
          deprecated: { since: "1.2.0", sunset: "2.0.0", replacement: "orders.order.cancel@2" },
        }
      : declared.name === "OrderPaid"
        ? { ...declared, deprecated: { since: "1.2.0", sunset: "2.0.0" } }
        : declared,
  ),
  shapes: COMMERCE_IR.shapes.map((shape) =>
    shape.name === "OrderView"
      ? {
          ...shape,
          fields: shape.fields.map((field) =>
            field.name === "note"
              ? {
                  ...field,
                  deprecated: {
                    since: "2026-11-26",
                    sunset: "2027-05-26",
                    replacement: "OrderView.remarks",
                  },
                }
              : field,
          ),
        }
      : shape,
  ),
  deprecatedTraits: [
    {
      name: "Discontinued",
      code: "discontinued",
      module: "orders",
      file: "src/modules/orders/traits/discontinued.trait.ts",
      importPath: "#modules/orders/traits/discontinued.trait",
      line: 3,
      column: 14,
      deprecated: { since: "1.2.0", sunset: "2.0.0", replacement: "Archivable" },
    },
  ],
};
