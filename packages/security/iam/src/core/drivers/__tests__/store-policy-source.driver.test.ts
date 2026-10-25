/**
 * Stackra file contract:
 * Purpose: unit tests of `StorePolicySourceDriver` over `MemoryPolicySnapshotStoreDriver`: it is a `PolicySource`; it
 *          answers the stored snapshot and an empty one for an unknown principal; the store keeps only newer versions.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decisions 1 to 4).
 */
import { type Actor, ActorKind, Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PolicySnapshotStore, PolicySource } from "#contracts/index";
import type { PolicySnapshot } from "#contracts/index";
import { MemoryPolicySnapshotStoreDriver } from "#core/drivers/memory-policy-snapshot-store.driver";
import { StorePolicySourceDriver } from "#core/drivers/store-policy-source.driver";

const rana: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2r1",
  realm: Realm.Tenant,
};

/** A snapshot at `version` holding one role. */
const at = (version: number): PolicySnapshot => ({
  version,
  grants: [{ role: "manager", scope: { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform" } }],
  roles: {},
  segments: [],
  denies: [],
  visibility: [],
});

describe("StorePolicySourceDriver", () => {
  it("answers the stored snapshot, or nothing for an unknown principal", async () => {
    const store = new MemoryPolicySnapshotStoreDriver();
    const source = new StorePolicySourceDriver(store);
    expect(source).toBeInstanceOf(PolicySource);
    expect(store).toBeInstanceOf(PolicySnapshotStore);
    expect((await source.snapshot(rana)).grants).toEqual([]);
    expect(await store.write(rana.id, at(2))).toBe(true);
    expect(await store.write(rana.id, at(1))).toBe(false);
    expect(await store.write(rana.id, at(2))).toBe(false);
    expect((await source.snapshot(rana)).version).toBe(2);
  });
});
