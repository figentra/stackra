/**
 * Stackra file contract:
 * Purpose: unit tests of `EnrollMemberAction`: the `account.enroll` action on its PUT route, a tool and an intent; a
 *          customer cannot enroll someone else, while staff and a customer enrolling themselves get the account at the
 *          tier asked.
 * Boundary: test only; the action is called directly with a recording account service and a fake action context. The
 *           pipeline's idempotency and the recorded event are the account service's and the pipeline's tests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0098; ADR 0136; ADR 0305 (rule 28).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, HttpMethod, Realm } from "@stackra/contracts";
import type { Actor, PublicId } from "@stackra/contracts";
import { refusal } from "@stackra/errors/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { NotOwnPrincipalError } from "#core/errors/not-own-principal.error";
import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import { EnrollMemberAction } from "#node/actions/enroll-member.action";
import { LoyaltyAccount } from "#node/models/loyalty-account.model";
import { EnrollMemberInput } from "#node/schemas/enroll-member-input.schema";
import { EnrollMemberOutput } from "#node/schemas/enroll-member-output.schema";
import type { AccountService } from "#node/services/account.service";

const accountId = "lac_01ja0000000000000000000012" as PublicId<"lac">;

/** A user of `realm`. */
const userOf = (id: string, realm: Realm): Actor => ({
  kind: ActorKind.User,
  id: id as PublicId<"usr">,
  realm,
});

/** The action over an account service that enrolls whatever it is asked. */
function actionWith() {
  const enroll = vi.fn(async (member: string, tier: LoyaltyTier, id?: PublicId<"lac">) =>
    Object.assign(new LoyaltyAccount(), { id, memberId: member, tier }),
  );
  return { enroll, action: new EnrollMemberAction({ enroll } as unknown as AccountService) };
}

describe("EnrollMemberAction", () => {
  it("is the account.enroll action on its PUT route, a tool and an intent", () => {
    expect(kindOf(EnrollMemberAction)?.options).toMatchObject({
      key: "account.enroll",
      permission: LoyaltyAccountPermissions.enroll,
      actors: [ActorKind.User, ActorKind.Agent, ActorKind.Service],
      endpoint: { method: HttpMethod.Put, path: "/loyalty/accounts/:accountId" },
      tool: true,
      intent: true,
    });
  });

  it("refuses a customer enrolling another principal", async () => {
    const { action, enroll } = actionWith();
    const input = EnrollMemberInput.create({
      accountId,
      principalId: "usr_2",
      tier: LoyaltyTier.Bronze,
    });

    await expect(
      action.handle(input, fakeActionContext({ actor: userOf("usr_1", Realm.Customer) })),
    ).rejects.toRefuseWith(refusal(NotOwnPrincipalError));
    expect(enroll).not.toHaveBeenCalled();
  });

  it("enrolls at the tier asked, for staff or for the customer themselves", async () => {
    const { action, enroll } = actionWith();
    const input = EnrollMemberInput.create({
      accountId,
      principalId: "usr_1",
      tier: LoyaltyTier.Silver,
    });

    const output = await action.handle(
      input,
      fakeActionContext({ actor: userOf("usr_staff", Realm.Platform) }),
    );
    await action.handle(input, fakeActionContext({ actor: userOf("usr_1", Realm.Customer) }));

    expect(output).toBeInstanceOf(EnrollMemberOutput);
    expect({ ...output }).toEqual({ accountId, tier: LoyaltyTier.Silver });
    expect(enroll).toHaveBeenCalledWith("usr_1", LoyaltyTier.Silver, accountId);
    expect(enroll).toHaveBeenCalledTimes(2);
  });
});
