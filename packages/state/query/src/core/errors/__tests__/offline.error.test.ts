/**
 * Stackra file contract:
 * Purpose: unit and type tests of `OfflineError`: an `unavailable` refusal with code `offline`, retryable, whose typed
 *          `create` takes the refused action key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0252; R-02 (typed `create`).
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { OfflineError } from "#core/errors/offline.error";

describe("OfflineError", () => {
  it("is a retryable unavailable refusal with code offline", () => {
    const refused = OfflineError.create({ action: "orders.order.cancel@1" });
    expect(isRefusal(refused, OfflineError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Unavailable);
    expect(refused.code).toBe("offline");
    expect(refused.retryable).toBe(true);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(503);
  });

  it("carries the refused action in its envelope", () => {
    expect(OfflineError.envelope({ action: "orders.order.cancel@1" })).toEqual({
      code: "offline",
      category: "unavailable",
      retryable: true,
      details: { action: "orders.order.cancel@1" },
    });
  });

  it("requires the action", () => {
    // @ts-expect-error -- `action` is required
    expect(OfflineError.create().code).toBe("offline");
  });
});
