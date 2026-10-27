/**
 * Stackra file contract:
 * Purpose: unit tests of `PartiesLoyaltyMembersDriver`: a live person is a member; an unknown (not-found refusal),
 *          merged-away or erased person is not; any other failure of the parties call is rethrown (fail closed).
 * Boundary: test only; the parties client is a stub of the one call the driver makes, the host subclass a local one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-804.
 */
import { NotFoundError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyMembers } from "#contracts/ports/loyalty-members.port";
import { memberId } from "#core/functions/member-id.function";
import { PartiesLoyaltyMembersDriver } from "#node/drivers/parties-loyalty-members.driver";

/** The person the stub answers, or the error it throws. */
type Answer = { mergedInto: string | null; erasedAt: Date | null } | Error;

/** A host driver over a stub client; `asked` lists the ids it read. */
class HostDriver extends PartiesLoyaltyMembersDriver {
  readonly asked: string[] = [];

  protected override readonly parties: PartiesLoyaltyMembersDriver["parties"];

  constructor(answer: Answer) {
    super();
    this.parties = {
      person: {
        get: {
          call: async ({ id }) => {
            this.asked.push(id);
            if (answer instanceof Error) throw answer;
            return answer;
          },
        },
      },
    };
  }
}

const live = { mergedInto: null, erasedAt: null };

describe("PartiesLoyaltyMembersDriver", () => {
  it("is a LoyaltyMembers driver", () => {
    expect(new HostDriver(live)).toBeInstanceOf(LoyaltyMembers);
  });

  it("answers a live person as a member, reading it by the member id", async () => {
    const driver = new HostDriver(live);
    expect(await driver.isMember(memberId("per_1"))).toBe(true);
    expect(driver.asked).toEqual(["per_1"]);
  });

  it("refuses a merged-away or erased person", async () => {
    expect(
      await new HostDriver({ mergedInto: "per_2", erasedAt: null }).isMember(memberId("per_1")),
    ).toBe(false);
    expect(
      await new HostDriver({ mergedInto: null, erasedAt: new Date(0) }).isMember(memberId("per_1")),
    ).toBe(false);
  });

  it("answers an unknown person as not a member", async () => {
    expect(await new HostDriver(NotFoundError.create()).isMember(memberId("per_9"))).toBe(false);
  });

  it("rethrows any other failure, so a redemption fails closed", async () => {
    await expect(
      new HostDriver(new Error("unreachable")).isMember(memberId("per_1")),
    ).rejects.toThrow("unreachable");
  });
});
