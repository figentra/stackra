/**
 * Stackra file contract:
 * Purpose: unit tests of `RedeemPointsAction`: the `points.redeem` action under the redeem permission, idempotency
 *          required, rate limited, on its POST route and a tool; its `handle` runs `RedeemPointsWorkflow` with the
 *          input and returns the run's output.
 * Boundary: test only; the action is called directly with a fake action context whose `run` records the call. The
 *           steps are the workflow's own tests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0098; ADR 0101; ADR 0305 (rule 28).
 */
import { Idempotency } from "@stackra/actions";
import type { ActionContext } from "@stackra/actions";
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, HttpMethod } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import { RedeemPointsAction } from "#node/actions/redeem-points.action";
import { RedeemPointsInput } from "#node/schemas/redeem-points-input.schema";
import { RedeemPointsOutput } from "#node/schemas/redeem-points-output.schema";
import { RedeemPointsWorkflow } from "#node/workflows/redeem-points.workflow";

describe("RedeemPointsAction", () => {
  it("is the points.redeem action: redeem permission, idempotency required, rate limited, on its POST route and a tool", () => {
    expect(kindOf(RedeemPointsAction)?.options).toMatchObject({
      key: "points.redeem",
      permission: LoyaltyAccountPermissions.redeem,
      actors: [ActorKind.User, ActorKind.Service],
      idempotency: Idempotency.Required,
      rateLimit: { perMinute: 30 },
      endpoint: { method: HttpMethod.Post, path: "/loyalty/redemptions" },
      tool: true,
    });
  });

  it("runs the redemption workflow with its input and returns the run's output", async () => {
    const answer = RedeemPointsOutput.create({ points: 300, amountMinor: 300, balance: 700 });
    const run = vi.fn(async (_workflow: unknown, _input: unknown) => answer);
    const ctx = fakeActionContext({ run: run as unknown as ActionContext["run"] });
    const input = RedeemPointsInput.create({ points: 300, reference: "ord_2", totalMinor: 10_000 });

    const output = await new RedeemPointsAction().handle(input, ctx);

    expect(run).toHaveBeenCalledWith(RedeemPointsWorkflow, input);
    expect(output).toBe(answer);
  });
});
