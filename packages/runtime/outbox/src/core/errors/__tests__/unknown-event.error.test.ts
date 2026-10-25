/**
 * Stackra file contract:
 * Purpose: unit tests of `UnknownEventError`: an `Internal` refusal that is retried, with code `unknown_event` and the
 *          wire name as its one detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0078 (decision 4).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { UnknownEventError } from "#core/errors/unknown-event.error";

describe("UnknownEventError", () => {
  it("is a retryable Internal refusal with code unknown_event and the wire name", () => {
    const refused = UnknownEventError.create({ type: "orders.order.paid.v2" });
    expect(isRefusal(refused, UnknownEventError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Internal);
    expect(refused.retryable).toBe(true);
    expect(refused.code).toBe("unknown_event");
    expect(refused.details).toEqual({ type: "orders.order.paid.v2" });
  });
});
