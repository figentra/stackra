/**
 * Stackra file contract:
 * Purpose: unit tests of `ResourceWireInvalidError`: a validation refusal with the code `resource_wire_invalid` carrying
 *          the resource and every issue.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140 (refusals); build-list item 54 (STA-1981).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ResourceWireInvalidError } from "#core/errors/resource-wire-invalid.error";

describe("ResourceWireInvalidError", () => {
  it("is a validation refusal naming the resource and the issues", () => {
    const issues = ['tree.options.operations.get: no client ref for "orders.order.get@1"'];
    const error = ResourceWireInvalidError.create({ resource: "orders.order", issues });
    expect(isRefusal(error, ResourceWireInvalidError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Validation);
    expect(error.toEnvelope()).toMatchObject({
      code: "resource_wire_invalid",
      details: { resource: "orders.order", issues },
    });
  });
});
