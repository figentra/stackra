/**
 * Stackra file contract:
 * Purpose: unit tests of `GuardianActingService` over `MemoryGuardianshipDriver`: a guardian with a live link acts for
 *          the minor; no link, an ended link, a restricted purpose, a minor of the pack's age, a non-user actor and
 *          acting for oneself are refused.
 * Boundary: test only; a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; OS-284.
 */
import { Driver } from "@stackra/container";
import { type Actor, ActorKind, Clock, Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MemoryGuardianshipDriver } from "#core/drivers/memory-guardianship.driver";
import { GuardianshipMissingError } from "#core/errors/guardianship-missing.error";
import { GuardianActingService } from "#core/services/guardian-acting.service";

/** Always 2026-10-25 09:00 UTC. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date("2026-10-25T09:00:00Z");
  }
}

const parent: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2p1",
  realm: Realm.Customer,
};
const exParent: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2p2",
  realm: Realm.Customer,
};
const CHILD = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1";

const guardians = new GuardianActingService(
  new MemoryGuardianshipDriver().seed([
    { guardian: parent.id, minor: CHILD, relationship: "parent", restrictions: ["pickup"] },
    {
      guardian: exParent.id,
      minor: CHILD,
      relationship: "parent",
      restrictions: [],
      until: new Date("2026-01-01T00:00:00Z"),
    },
  ]),
  new FixedClockDriver(),
);

describe("GuardianActingService", () => {
  it("lets a linked guardian act for the minor", async () => {
    expect(await guardians.actFor(parent, CHILD, { purpose: "photos" })).toEqual({
      principal: CHILD,
      actingBy: parent.id,
      relationship: "parent",
      purpose: "photos",
      at: new Date("2026-10-25T09:00:00Z"),
    });
    await expect(
      guardians.actFor(parent, CHILD, {
        purpose: "photos",
        birthDate: "2012-05-01",
        ageOfMajority: 18,
      }),
    ).resolves.toMatchObject({ principal: CHILD });
  });

  it("refuses every missing condition the same way", async () => {
    const refusals = [
      guardians.actFor(exParent, CHILD, { purpose: "photos" }),
      guardians.actFor(parent, CHILD, { purpose: "pickup" }),
      guardians.actFor(parent, CHILD, {
        purpose: "photos",
        birthDate: "2008-10-25",
        ageOfMajority: 18,
      }),
      guardians.actFor({ kind: ActorKind.Agent, id: "agt_1" }, CHILD, { purpose: "photos" }),
      guardians.actFor(parent, parent.id, { purpose: "photos" }),
      guardians.actFor(parent, "usr_01j9z3k4m5n6p7q8r9s0t1v2x1", { purpose: "photos" }),
    ];
    for (const refusal of refusals)
      await expect(refusal).rejects.toBeInstanceOf(GuardianshipMissingError);
  });
});
