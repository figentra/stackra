/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryActorStatusCheckDriver`: active and unchanged by default, `forbidden` for an inactive
 *          actor or chain link, `step_up_required` for a change after the instant, and a plain rejection in an outage.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0509; STA-1724 FR-016 (e).
 */
import { type Actor, ActorKind, Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ActorStatusCheck } from "#contracts/ports/actor-status-check.port";
import { MemoryActorStatusCheckDriver } from "#testing/drivers/memory-actor-status-check.driver";

const user: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Staff };
const agent: Actor = { kind: ActorKind.Agent, id: "agt_1", onBehalfOf: user };

describe(MemoryActorStatusCheckDriver, () => {
  it("is an ActorStatusCheck that passes everyone by default", async () => {
    const actors = new MemoryActorStatusCheckDriver();
    expect(actors).toBeInstanceOf(ActorStatusCheck);
    await expect(actors.requireActive(agent)).resolves.toBeUndefined();
    await expect(actors.requireUnchangedSince(agent, new Date(0))).resolves.toBeUndefined();
  });

  it("refuses forbidden for an inactive actor or a revoked link of the chain", async () => {
    const actors = new MemoryActorStatusCheckDriver();
    actors.deactivate("usr_1");
    await expect(actors.requireActive(user)).rejects.toMatchObject({ code: "forbidden" });
    await expect(actors.requireActive(agent)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("refuses step_up_required for a change after the instant, not before it", async () => {
    const actors = new MemoryActorStatusCheckDriver();
    actors.markChanged("usr_1", new Date("2026-11-01T10:00:00.000Z"));
    await expect(
      actors.requireUnchangedSince(agent, new Date("2026-11-01T09:00:00.000Z")),
    ).rejects.toMatchObject({ code: "step_up_required" });
    await expect(
      actors.requireUnchangedSince(agent, new Date("2026-11-01T11:00:00.000Z")),
    ).resolves.toBeUndefined();
  });

  it("rejects with a plain error in an outage", async () => {
    const actors = new MemoryActorStatusCheckDriver();
    actors.setOutage(true);
    await expect(actors.requireActive(user)).rejects.toThrow("identity is unavailable");
  });
});
