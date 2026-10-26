/**
 * Stackra file contract:
 * Purpose: unit tests of `hashAccessLink`: the hash is `@stackra/support`'s `canonicalHash` of the link tuple, and a
 *          pinned record hashes to the value this package wrote before the switch (STA-821), so stored chains still
 *          verify; key order of the actor does not change it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0212 (decision 3); ADR 0416; STA-821.
 */
import { ActorKind, DataClassification, Realm } from "@stackra/contracts";
import { canonicalHash } from "@stackra/support";
import { describe, expect, it } from "@stackra/testing";

import type { AccessRecord } from "#contracts/types/access-record.type";
import { hashAccessLink } from "#core/functions/hash-access-link.function";

const RECORD: AccessRecord = {
  callId: "call_1",
  actor: { kind: ActorKind.User, id: "usr_staff", realm: Realm.Platform },
  target: "Reads.view",
  classification: DataClassification.Personal,
  subjects: ["usr_1"],
  at: new Date("2026-10-24T08:00:00.000Z"),
};

const GENESIS = "0".repeat(64);

describe(hashAccessLink, () => {
  it("hashes the pinned record as the chain always did", async () => {
    expect(await hashAccessLink(RECORD, 1, GENESIS)).toBe(
      "1a9672a224898dc45a6648f1a9451c90f789f0a70fc23c5c7c974f68eb79b94f",
    );
  });

  it("is the support canonical hash of the link tuple, whatever the actor's key order", async () => {
    const { callId, actor, target, classification, subjects, at } = RECORD;
    expect(await hashAccessLink(RECORD, 1, GENESIS)).toBe(
      await canonicalHash([GENESIS, 1, callId, actor, target, classification, subjects, at]),
    );
    const reordered = {
      ...RECORD,
      actor: { realm: Realm.Platform, id: "usr_staff", kind: ActorKind.User },
    };
    expect(await hashAccessLink(reordered as AccessRecord, 1, GENESIS)).toBe(
      await hashAccessLink(RECORD, 1, GENESIS),
    );
  });
});
