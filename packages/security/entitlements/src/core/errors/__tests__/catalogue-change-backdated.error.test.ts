/**
 * Stackra file contract:
 * Purpose: unit tests of `CatalogueChangeBackdatedError`: a non-retryable `validation` refusal with code `catalogue_change_backdated` and its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0391.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { CatalogueChangeBackdatedError } from "#core/errors/catalogue-change-backdated.error";

describe("CatalogueChangeBackdatedError", () => {
  it("is a validation refusal naming the record", () => {
    const error = CatalogueChangeBackdatedError.create({
      key: "price-list:commerce",
      effectiveFrom: "2026-01-01T00:00:00.000Z",
    });
    expect(isRefusal(error)).toBe(true);
    expect([error.code, error.kind, error.retryable]).toEqual([
      "catalogue_change_backdated",
      ErrorKind.Validation,
      false,
    ]);
    expect(error.details).toEqual({
      key: "price-list:commerce",
      effectiveFrom: "2026-01-01T00:00:00.000Z",
    });
  });
});
