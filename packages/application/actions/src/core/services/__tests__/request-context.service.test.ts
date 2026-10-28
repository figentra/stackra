/**
 * Stackra file contract:
 * Purpose: unit tests of `RequestContext`: inside a stored call it returns that call's context, across `await` and
 *          for concurrent calls each their own; outside every call it throws.
 * Boundary: test only; the storage is the `./node` AsyncLocalStorage driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0136 (decision 1).
 */
import { Service } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { RequestContext } from "#core/services/request-context.service";
import { AsyncContextStorageDriver } from "#node/drivers/async-context-storage.driver";

describe(RequestContext, () => {
  it("is a service that throws outside a call", () => {
    const request = new RequestContext(new AsyncContextStorageDriver());
    expect(request).toBeInstanceOf(Service);
    expect(() => request.current()).toThrow(/outside an action or query call/);
  });

  it("returns each concurrent call's own context across await", async () => {
    const storage = new AsyncContextStorageDriver();
    const request = new RequestContext(storage);
    const read = (callId: string) =>
      storage.run({ callId }, async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, callId === "call_a" ? 5 : 0);
        });
        return request.current().callId;
      });
    expect(await Promise.all([read("call_a"), read("call_b")])).toEqual(["call_a", "call_b"]);
  });
});
