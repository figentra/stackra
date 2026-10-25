/**
 * Stackra file contract:
 * Purpose: unit tests of `decodeRefusal`: an envelope becomes an instance of the loaded refusal ref (the action's module
 *          first when two modules share a code) with the envelope's kind, `retryable`, details and field errors, a
 *          detail cannot shadow a refusal's own field, and an unknown code becomes a `ServerRefusalError`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140 (envelope and kinds).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ServerRefusalError } from "#core/errors/server-refusal.error";
import { decodeRefusal } from "#core/functions/decode-refusal.function";
import { refusalRef } from "#core/functions/refusal-ref.function";

class InsufficientStockError extends refusalRef("inventory.insufficient_stock") {}

class CatalogueNotFoundError extends refusalRef("catalogue.not_found") {}

class ExperienceNotFoundError extends refusalRef("experience.not_found") {}

describe("decodeRefusal", () => {
  it("decodes into the loaded ref with the envelope's kind, details and field errors", () => {
    const error = decodeRefusal({
      code: "insufficient_stock",
      category: "conflict",
      retryable: false,
      details: { available: 1 },
      fieldErrors: { "lines.0.quantity": "too_many" },
      action: "orders.order.create@1",
    });
    expect(error).toBeInstanceOf(Object.getPrototypeOf(InsufficientStockError));
    expect(isRefusal(error, InsufficientStockError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Conflict);
    expect(error.category).toBe("conflict");
    expect(error.details).toEqual({ available: 1 });
    expect(error.fieldErrors).toEqual({ "lines.0.quantity": "too_many" });
  });

  it("takes retryable from the envelope", () => {
    const error = decodeRefusal({
      code: "insufficient_stock",
      category: "conflict",
      retryable: true,
    });
    expect(error.retryable).toBe(true);
  });

  it("prefers the refusal of the action's module when two share a code", () => {
    const envelope = { code: "not_found", category: "not_found", retryable: false } as const;
    expect(decodeRefusal({ ...envelope, action: "experience.document.get@1" })).toBeInstanceOf(
      Object.getPrototypeOf(ExperienceNotFoundError),
    );
    expect(decodeRefusal({ ...envelope, action: "catalogue.product.get@1" })).toBeInstanceOf(
      Object.getPrototypeOf(CatalogueNotFoundError),
    );
  });

  it("keeps a refusal's own fields from a detail of the same name", () => {
    const error = decodeRefusal({
      code: "insufficient_stock",
      category: "conflict",
      retryable: false,
      details: { code: "spoofed", kind: "internal", available: 0 },
    });
    expect(error.code).toBe("insufficient_stock");
    expect(error.kind).toBe(ErrorKind.Conflict);
    expect(error.details).toEqual({ available: 0 });
  });

  it("decodes an unknown code into a server refusal that keeps the code", () => {
    const error = decodeRefusal({
      code: "orders_paused",
      category: "precondition_failed",
      retryable: false,
    });
    expect(error).toBeInstanceOf(ServerRefusalError);
    expect(error.code).toBe("orders_paused");
    expect(error.kind).toBe(ErrorKind.FailedPrecondition);
    expect(error.refusalKey).toBeUndefined();
  });
});
