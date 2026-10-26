/**
 * Stackra file contract:
 * Purpose: unit and type tests of `isRefusal`: a refusal is recognised and narrowed, anything else is not (a plain
 *          `Error`, an envelope, a primitive), a class matches by code, a refusal from another copy of the package
 *          (same registry symbol, no shared prototype) counts, and a subclass that reports another code (a remote
 *          refusal) is matched by that code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0232; ADR 0140.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";
import { isRefusal } from "#core/functions/is-refusal.function";

class VariantNotFoundError extends Refusal({
  kind: ErrorKind.NotFound,
  retryable: false,
}) {
  barcode?: string;
}

class OrdersPausedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}

/** What a generated client's remote refusal does: its code comes from the remote manifest, not its class name. */
class RemoteMarketUnknownError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
Object.defineProperty(RemoteMarketUnknownError.prototype, "code", { get: () => "market_unknown" });

describe("isRefusal", () => {
  it("recognises a refusal and narrows it", () => {
    const error: unknown = VariantNotFoundError.create({ barcode: "4006381333931" });
    expect(isRefusal(error)).toBe(true);
    if (isRefusal(error)) expectTypeOf(error.kind).toEqualTypeOf<ErrorKind>();
  });

  it("refuses everything that is not a refusal", () => {
    for (const value of [
      new Error("x"),
      new TypeError("x is undefined"),
      { code: "not_found", category: "not_found", retryable: false },
      "not_found",
      undefined,
      null,
      42,
    ])
      expect(isRefusal(value)).toBe(false);
  });

  it("matches a class by its code and narrows to it", () => {
    const error: unknown = VariantNotFoundError.create({ barcode: "1" });
    expect(isRefusal(error, VariantNotFoundError)).toBe(true);
    expect(isRefusal(error, OrdersPausedError)).toBe(false);
    if (isRefusal(error, VariantNotFoundError))
      expectTypeOf(error.barcode).toEqualTypeOf<string | undefined>();
  });

  it("recognises a refusal built by another copy of the package", () => {
    const foreign = Object.assign(Object.create(null) as object, {
      [Symbol.for("stackra.errors.refusal")]: true,
      code: "orders_paused",
    });
    expect(isRefusal(foreign)).toBe(true);
    expect(isRefusal(foreign, OrdersPausedError)).toBe(true);
  });

  it("matches a subclass that reports its own code by that code", () => {
    const remote = RemoteMarketUnknownError.create();
    expect(remote.code).toBe("market_unknown");
    expect(isRefusal(remote, RemoteMarketUnknownError)).toBe(true);
    expect(isRefusal(remote, VariantNotFoundError)).toBe(false);
  });
});
