/**
 * Stackra file contract:
 * Purpose: unit tests of `toHaveLoggedAccess`: it passes on a matching record of the memory sink or the fake, checks
 *          the target, every given subject and the actor id, and fails on a sink it cannot read.
 * Boundary: test only; the matcher is registered by importing its module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import { ActorKind, DataClassification, Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { AccessRecord } from "#contracts/types/access-record.type";
import { MemoryAccessLogSinkDriver } from "#core/drivers/memory-access-log-sink.driver";
import { AccessLogSinkFake } from "#testing/access-log-sink.fake";
import { toHaveLoggedAccess } from "#testing/to-have-logged-access.matcher";

const RECORD: AccessRecord = {
  callId: "call_1",
  actor: { kind: ActorKind.User, id: "usr_staff", realm: Realm.Platform },
  target: "CustomerReads.view",
  classification: DataClassification.Personal,
  subjects: ["cus_1", "cus_2"],
  at: new Date("2026-10-24T08:00:00Z"),
};

describe("toHaveLoggedAccess", () => {
  it("passes on a matching record of the memory sink and of the fake", async () => {
    const memory = new MemoryAccessLogSinkDriver();
    const fake = AccessLogSinkFake.with();
    await memory.write(RECORD);
    await fake.write(RECORD);
    for (const sink of [memory, fake])
      expect(sink).toHaveLoggedAccess({
        target: "CustomerReads.view",
        subjects: ["cus_2"],
        actorId: "usr_staff",
      });
  });

  it("fails on another target, a missing subject or another actor", async () => {
    const fake = AccessLogSinkFake.with();
    await fake.write(RECORD);
    expect(fake).not.toHaveLoggedAccess({ target: "CustomerReads.list" });
    expect(fake).not.toHaveLoggedAccess({ target: "CustomerReads.view", subjects: ["cus_3"] });
    expect(fake).not.toHaveLoggedAccess({ target: "CustomerReads.view", actorId: "usr_other" });
  });

  it("fails on a sink it cannot read", async () => {
    // a matcher's result type allows a promise; this one answers at once
    const result = await toHaveLoggedAccess({}, { target: "CustomerReads.view" });
    expect(result.pass).toBe(false);
    expect(result.message()).toContain("memory access-log sink");
  });
});
