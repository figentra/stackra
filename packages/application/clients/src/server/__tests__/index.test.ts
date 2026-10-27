/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./server` entry: `createPublicClients` and `RetryOn`, which the template's
 *          generated `clients.server.ts` imports, are exported, nothing else is, and `PublicClients` resolves. `RetryOn`
 *          is the @stackra/contracts code since stackra-223.
 * Boundary: test only; imports the stand-in barrel through its `#server` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { RetryOn } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as server from "#server/index";
import type { PublicClients } from "#server/index";

describe("@stackra/clients/server", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(server).sort()).toEqual(["RetryOn", "createPublicClients"]);
    expect(server.RetryOn).toBe(RetryOn);
  });

  it("resolves PublicClients", () => {
    expectTypeOf<keyof PublicClients>().toEqualTypeOf<"query" | "action">();
  });
});
