/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the `ClientTransport` and `ClientSession` ports and the
 *          `TransportFailure` reasons are exported, nothing else is, the ports are keyed `clients.<Port>`, and
 *          `ClientRequest` resolves.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { ClientRequest, ClientSession, ClientTransport } from "#contracts/index";

describe("@stackra/clients/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "ClientSession",
      "ClientTransport",
      "TransportFailure",
    ]);
  });

  it("keys the ports and resolves the request type", () => {
    expectTypeOf<ClientTransport["~key"]>().toEqualTypeOf<"clients.ClientTransport">();
    expectTypeOf<ClientSession["~key"]>().toEqualTypeOf<"clients.ClientSession">();
    expectTypeOf<ClientRequest["kind"]>().toEqualTypeOf<"action" | "query">();
  });
});
