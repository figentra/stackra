/**
 * Stackra file contract:
 * Purpose: unit tests of `ConfirmRedemptionAction`: the `points.confirm_redemption` action under the redeem permission,
 *          on its PUT route and no tool; it sends `RedemptionConfirmed` correlated on the member and the reference,
 *          the member being the customer a service acts for when there is one, and echoes the reference.
 * Boundary: test only; the action is called directly with a fake action context whose `signal` records the call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0098; ADR 0152 (decision 1); ADR 0305 (rule 28).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, HttpMethod } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { actors } from "@stackra/iam/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import { ConfirmRedemptionAction } from "#node/actions/confirm-redemption.action";
import { ConfirmRedemptionInput } from "#node/schemas/confirm-redemption-input.schema";
import { RedemptionConfirmed } from "#node/workflows/redemption-confirmed.signal";

/** The customer whose redemption is confirmed. */
const CUSTOMER = "usr_01ja0000000000000000000001";

/** The action called by `actor`, with what it signalled. */
async function confirmAs(actor: Actor) {
  const signal = vi.fn(async (_signal: unknown, _payload: object, _correlation?: object) => {});
  const ctx = fakeActionContext({ actor, signal });
  const output = await new ConfirmRedemptionAction().handle(
    ConfirmRedemptionInput.create({ reference: "ord_2" }),
    ctx,
  );
  return { signal, output };
}

describe("ConfirmRedemptionAction", () => {
  it("is the points.confirm_redemption action under the redeem permission, on its PUT route and no tool", () => {
    expect(kindOf(ConfirmRedemptionAction)?.options).toMatchObject({
      key: "points.confirm_redemption",
      permission: LoyaltyAccountPermissions.redeem,
      actors: [ActorKind.User, ActorKind.Service],
      endpoint: { method: HttpMethod.Put, path: "/loyalty/redemptions/:reference/confirm" },
      tool: false,
    });
  });

  it("signals the confirmation correlated on the member and the reference", async () => {
    const { signal, output } = await confirmAs(actors.customer(CUSTOMER));
    const confirmation = { memberId: CUSTOMER, reference: "ord_2" };
    expect(signal).toHaveBeenCalledWith(RedemptionConfirmed, confirmation, confirmation);
    expect({ ...output }).toEqual({ reference: "ord_2" });
  });

  it("confirms for the customer a service acts for", async () => {
    const service = actors.service("checkout", { onBehalfOf: actors.customer(CUSTOMER) });
    const { signal } = await confirmAs(service);
    expect(signal.mock.calls[0]?.[1]).toEqual({ memberId: CUSTOMER, reference: "ord_2" });
  });
});
