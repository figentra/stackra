/**
 * Stackra file contract:
 * Purpose: unit tests of `CatalogueVersionNotPendingError`: a non-retryable `conflict` refusal with code `catalogue_version_not_pending` and its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0391.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { CatalogueVersionNotPendingError } from "#core/errors/catalogue-version-not-pending.error";

describe("CatalogueVersionNotPendingError", () => {
  it("is a conflict refusal naming the record", () => {
    const error = CatalogueVersionNotPendingError.create({ key: "offer:founding", version: 2 });
    expect(isRefusal(error)).toBe(true);
    expect([error.code, error.kind, error.retryable]).toEqual([
      "catalogue_version_not_pending",
      ErrorKind.Conflict,
      false,
    ]);
    expect(error.details).toEqual({ key: "offer:founding", version: 2 });
  });
});
