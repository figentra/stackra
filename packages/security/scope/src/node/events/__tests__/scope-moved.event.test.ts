/**
 * Stackra file contract:
 * Purpose: unit tests of `ScopeMoved`: an integration event named `node.moved`, version 1, carrying the node's id and
 *          its old and new paths.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141; ADR 0411.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { ScopeMoved } from "#node/events/scope-moved.event";

describe("ScopeMoved", () => {
  it("is the node.moved integration event carrying the old and the new path", () => {
    expect(kindOf(ScopeMoved)?.kind).toBe("integration_event");
    expect(kindOf(ScopeMoved)?.options).toMatchObject({ name: "node.moved", version: 1 });
    const event = ScopeMoved.create({
      scopeId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1",
      from: "platform.a.shop",
      to: "platform.b.shop",
    });
    expect(event).toMatchObject({ from: "platform.a.shop", to: "platform.b.shop" });
  });
});
