/**
 * Stackra file contract:
 * Purpose: unit and type tests of `TransportFailure`: its three snake_case codes and the type of the same name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { TransportFailure } from "#contracts/enums/transport-failure.enum";

describe("TransportFailure", () => {
  it("has the network, timeout and response codes", () => {
    expect(Enum.values(TransportFailure)).toEqual(["network", "timeout", "response"]);
    expectTypeOf<TransportFailure>().toEqualTypeOf<"network" | "timeout" | "response">();
  });
});
