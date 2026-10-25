/**
 * Stackra file contract:
 * Purpose: unit tests of `EarnVisitAction`: the `points.earn_visit` action of staff and services on its POST route,
 *          which stamps the visit with the `stampsPerVisit` setting and answers the card the `stampsPerCard` setting
 *          reads.
 * Boundary: test only; the action is called directly with a recording account service over the memory ledger and
 *           `fakeSettings`, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0098; the PUT-133 answer.
 */
import { kindOf } from "@stackra/container";
import { ActorKind, HttpMethod } from "@stackra/contracts";
import { fakeSettings } from "@stackra/settings/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { EntryKind } from "#contracts/enums/entry-kind.enum";
import type { MemberId } from "#contracts/types/member-id.type";
import type { VisitRequest } from "#contracts/types/visit-request.type";
import { MemoryLoyaltyLedgerDriver } from "#core/drivers/memory-loyalty-ledger.driver";
import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import { EarnVisitAction } from "#node/actions/earn-visit.action";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";
import { EarnVisitInput } from "#node/schemas/earn-visit-input.schema";
import { EarnVisitOutput } from "#node/schemas/earn-visit-output.schema";
import type { AccountService } from "#node/services/account.service";

describe("EarnVisitAction", () => {
  it("is the points.earn_visit action of staff and services", () => {
    expect(kindOf(EarnVisitAction)?.options).toMatchObject({
      key: "points.earn_visit",
      permission: LoyaltyAccountPermissions.stamp,
      actors: [ActorKind.User, ActorKind.Service],
      endpoint: { method: HttpMethod.Post, path: "/loyalty/visits" },
    });
  });

  it("stamps with the setting and answers the card", async () => {
    const ledger = new MemoryLoyaltyLedgerDriver();
    const earnVisit = vi.fn(async (member: MemberId, request: VisitRequest) => {
      await ledger.append({
        memberId: member,
        points: request.stamps,
        kind: EntryKind.Earn,
        reference: request.reference,
        at: new Date("2026-10-25T10:00:00Z"),
      });
      return request.stamps;
    });
    const action = new EarnVisitAction(
      { earnVisit } as unknown as AccountService,
      ledger,
      fakeSettings([[LoyaltyKitSettings, { stampsPerVisit: 2, stampsPerCard: 5 }]]),
    );

    await action.handle(EarnVisitInput.create({ principalId: "usr_1", reference: "apt_1" }));
    await action.handle(EarnVisitInput.create({ principalId: "usr_1", reference: "apt_2" }));
    const output = await action.handle(
      EarnVisitInput.create({ principalId: "usr_1", reference: "apt_3" }),
    );

    expect(earnVisit).toHaveBeenLastCalledWith("usr_1", { reference: "apt_3", stamps: 2 });
    expect(output).toBeInstanceOf(EarnVisitOutput);
    expect({ ...output }).toEqual({ stamps: 2, onCard: 1, perCard: 5, fullCards: 1 });
  });
});
