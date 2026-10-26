/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Refusal`: the called form only (bare is a type error), an invalid kind refused,
 *          the code derived from the class name, category and retry flag from the kind and the options, typed details
 *          on `create` (required exactly when a field is), details read from the set fields only, field errors and the
 *          cause kept off the details, the ADR 0140 envelope from `toEnvelope` and the static `envelope`, an `Error`
 *          with a stack, `name` and `message`, and the kind registry record.
 * Boundary: test only; the refusal classes are template-shaped (fields declared with `!` and `?`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16,
 *                     20 and 25); ADR 0305 (rule 2); ADR 0140.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";
import type { ErrorEnvelope } from "#core/types/error-envelope.type";
import type { RefusalClass } from "#core/types/refusal-class.type";

class OrderNotPayableError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  orderId!: string;

  status!: "draft" | "paid";
}

class ProductNotFoundError extends Refusal({
  kind: ErrorKind.NotFound,
  retryable: false,
}) {
  id?: string;

  slug?: string;
}

class SiteContextMissingError extends Refusal({ kind: ErrorKind.FailedPrecondition }) {}

class AccessLogWriteFailedError extends Refusal({ kind: ErrorKind.Unavailable }) {}

class StockRefusedError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: false,
}) {}

describe("Refusal", () => {
  it("is called with its kind; the bare form does not compile", () => {
    expectTypeOf(Refusal({ kind: ErrorKind.Conflict })).toEqualTypeOf<RefusalClass>();
    // @ts-expect-error -- a refusal needs its kind, so the kind base is called only
    class BareError extends Refusal {}
    expect(BareError).toBeTypeOf("function");
    expect(() =>
      // @ts-expect-error -- the kind is required
      Refusal({ retryable: true }),
    ).toThrow(RangeError);
  });

  it("refuses a kind outside ErrorKind when the class is declared", () => {
    expect(() => Refusal({ kind: "teapot" as ErrorKind })).toThrow(RangeError);
    expect(() => Refusal({ kind: "teapot" as ErrorKind })).toThrow(/needs a kind from ErrorKind/);
  });

  it("derives the code from the class name", () => {
    expect(OrderNotPayableError.create({ orderId: "ord_1", status: "paid" }).code).toBe(
      "order_not_payable",
    );
    expect(AccessLogWriteFailedError.create().code).toBe("access_log_write_failed");
  });

  it("reads the category from the kind and the retry flag from the options, else the kind", () => {
    const missing = SiteContextMissingError.create();
    expect(missing.kind).toBe(ErrorKind.FailedPrecondition);
    expect(missing.category).toBe("precondition_failed");
    expect(missing.retryable).toBe(false);
    expect(AccessLogWriteFailedError.create().retryable).toBe(true);
    expect(StockRefusedError.create().retryable).toBe(false);
  });

  it("types the details of create: required with a required field, optional otherwise", () => {
    expectTypeOf(
      OrderNotPayableError.create({ orderId: "ord_1", status: "draft" }),
    ).toEqualTypeOf<OrderNotPayableError>();
    expectTypeOf(ProductNotFoundError.create()).toEqualTypeOf<ProductNotFoundError>();
    // @ts-expect-error -- a required detail is missing
    const missingDetail = () => OrderNotPayableError.create({ orderId: "ord_1" });
    // @ts-expect-error -- details are required when a field is required
    const noDetails = () => OrderNotPayableError.create();
    // @ts-expect-error -- a detail of the wrong type
    const wrongType = () => OrderNotPayableError.create({ orderId: 1, status: "draft" });
    const sharedMember = () =>
      OrderNotPayableError.create({
        orderId: "ord_1",
        status: "draft",
        // @ts-expect-error -- shared members are not details
        code: "x",
      });
    expect([missingDetail, noDetails, wrongType, sharedMember]).toHaveLength(4);
  });

  it("sets the details and reads back only the fields that were set", () => {
    const bySlug = ProductNotFoundError.create({ slug: "tee" });
    expect(bySlug.slug).toBe("tee");
    expect(bySlug.details).toEqual({ slug: "tee" });
    expect(Object.isFrozen(bySlug.details)).toBe(true);
    expect(SiteContextMissingError.create().details).toEqual({});
  });

  it("keeps field errors and the cause off the details", () => {
    const cause = new Error("db down");
    const refused = OrderNotPayableError.create(
      { orderId: "ord_1", status: "paid" },
      { fieldErrors: { orderId: "order_not_payable" }, cause },
    );
    expect(refused.fieldErrors).toEqual({ orderId: "order_not_payable" });
    expect(Object.isFrozen(refused.fieldErrors)).toBe(true);
    expect(refused.cause).toBe(cause);
    expect(refused.details).toEqual({ orderId: "ord_1", status: "paid" });
    expect(SiteContextMissingError.create().fieldErrors).toBeUndefined();
  });

  it("serialises to the ADR 0140 envelope, leaving out what was not set", () => {
    const refused = OrderNotPayableError.create(
      { orderId: "ord_1", status: "paid" },
      { fieldErrors: { orderId: "order_not_payable" } },
    );
    expect(
      refused.toEnvelope({ correlationId: "trc_1", action: "orders.order.capture@1" }),
    ).toEqual<ErrorEnvelope>({
      code: "order_not_payable",
      category: "conflict",
      retryable: false,
      details: { orderId: "ord_1", status: "paid" },
      fieldErrors: { orderId: "order_not_payable" },
      correlationId: "trc_1",
      action: "orders.order.capture@1",
    });
    expect(Object.keys(SiteContextMissingError.create().toEnvelope())).toEqual([
      "code",
      "category",
      "retryable",
    ]);
    expect(JSON.parse(JSON.stringify(refused.toEnvelope()))).toEqual(refused.toEnvelope());
  });

  it("builds an envelope without throwing through the static envelope", () => {
    expect(ProductNotFoundError.envelope({ id: "prd_1" })).toEqual({
      code: "product_not_found",
      category: "not_found",
      retryable: false,
      details: { id: "prd_1" },
    });
    expectTypeOf(SiteContextMissingError.envelope()).toEqualTypeOf<ErrorEnvelope>();
  });

  it("is an Error with a stack, named after its class, whose message is its code", () => {
    const refused = SiteContextMissingError.create();
    expect(refused).toBeInstanceOf(Error);
    expect(refused).toBeInstanceOf(SiteContextMissingError);
    expect(refused.name).toBe("SiteContextMissingError");
    expect(refused.message).toBe("site_context_missing");
    expect(refused.stack).toEqual(expect.any(String));
    expect(() => {
      throw refused;
    }).toThrow(SiteContextMissingError);
  });

  it("records the kind and its options in the kind registry", () => {
    expect(kindOf(OrderNotPayableError)).toEqual({
      kind: "refusal",
      options: { kind: ErrorKind.Conflict, retryable: false },
    });
    expect(Refusal.name).toBe("Refusal");
  });

  it("fails loudly on a class that skips the called form", () => {
    const Base = Object.getPrototypeOf(Object.getPrototypeOf(OrderNotPayableError)) as new () => {
      readonly kind: unknown;
    };
    expect(() => new Base().kind).toThrow(/does not extend Refusal\(\{ kind \}\)/);
  });
});
