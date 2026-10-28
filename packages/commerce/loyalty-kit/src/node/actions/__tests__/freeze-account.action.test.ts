/**
 * Stackra file contract:
 * Purpose: unit tests of `FreezeAccountAction`: the `account.freeze` action on its PUT route and a tool, which loads the
 *          account, authorizes against it, and sets the flag at the call's instant.
 * Boundary: test only; the action is called directly with a stand-in account service and a fake action context that
 *           records what it authorized.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0098; ADR 0305 (rule 28).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, HttpMethod } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import { FreezeAccountAction } from "#node/actions/freeze-account.action";
import { LoyaltyAccount } from "#node/models/loyalty-account.model";
import { FreezeAccountInput } from "#node/schemas/freeze-account-input.schema";
import type { AccountService } from "#node/services/account.service";

const accountId = "lac_01ja0000000000000000000011" as PublicId<"lac">;

describe("FreezeAccountAction", () => {
  it("is the account.freeze action under its L2 permission, on its PUT route and a tool", () => {
    expect(kindOf(FreezeAccountAction)?.options).toMatchObject({
      key: "account.freeze",
      permission: LoyaltyAccountPermissions.freeze,
      actors: [ActorKind.User, ActorKind.Agent],
      endpoint: { method: HttpMethod.Put, path: "/loyalty/accounts/:accountId/freeze" },
      tool: true,
    });
  });

  it("authorizes against the account and sets the flag at the call's instant", async () => {
    const account = Object.assign(new LoyaltyAccount(), { id: accountId, memberId: "usr_1" });
    const setFrozen = vi.fn(async (target: LoyaltyAccount, isFrozen: boolean, at: Date) => {
      target.isFrozen = isFrozen;
      target.frozenAt = at;
    });
    const findOneOrFail = vi.fn(async (_where: object) => account);
    const action = new FreezeAccountAction({
      findOneOrFail,
      setFrozen,
    } as unknown as AccountService);
    const now = new Date("2026-10-21T00:00:00Z");
    const ctx = fakeActionContext({ now: () => new Date(now) });

    const output = await action.handle(
      FreezeAccountInput.create({ accountId, isFrozen: true }),
      ctx,
    );

    expect(findOneOrFail).toHaveBeenCalledWith({ id: accountId });
    expect(ctx.recorded.authorized).toEqual([account]);
    expect(setFrozen).toHaveBeenCalledWith(account, true, now);
    expect({ ...output }).toEqual({ accountId, isFrozen: true });
  });
});
