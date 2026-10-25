/**
 * Stackra file contract:
 * Purpose: unit tests of `ActionRunnerClient`: it sends any action ref through the transport it was given.
 * Boundary: test only, over the client fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0260 (decisions 3 and 4).
 */
import { actionRef } from "@stackra/clients";
import { fakeClient } from "@stackra/clients/testing";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { ActionRunnerClient } from "#react/action-runner/action-runner.client";

class CancelOrderAction extends actionRef("orders.order.cancel@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({ status: z.string() }),
}) {}

describe("ActionRunnerClient", () => {
  it("sends the action through its transport", async () => {
    const fake = fakeClient((client) =>
      client.on(CancelOrderAction).returns({ status: "cancelled" }),
    );
    await expect(
      new ActionRunnerClient(fake).send(CancelOrderAction, { orderId: "ord_1" }),
    ).resolves.toEqual({
      status: "cancelled",
    });
    expect(fake.called(CancelOrderAction)).toHaveLength(1);
  });
});
