/**
 * Stackra file contract:
 * Purpose: unit tests of `ViewKeyUnknownError`: a validation refusal with the code `view_key_unknown` carrying the
 *          resource and every unknown key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0271 (decision 4).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ViewKeyUnknownError } from "#core/errors/view-key-unknown.error";

describe("ViewKeyUnknownError", () => {
  it("is a validation refusal naming the resource and the keys", () => {
    const error = ViewKeyUnknownError.create({ resource: "orders.order", keys: ["legacy"] });
    expect(isRefusal(error, ViewKeyUnknownError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Validation);
    expect(error.toEnvelope()).toMatchObject({
      code: "view_key_unknown",
      details: { resource: "orders.order", keys: ["legacy"] },
    });
  });
});
