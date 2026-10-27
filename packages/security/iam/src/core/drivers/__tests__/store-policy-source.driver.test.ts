/**
 * Stackra file contract:
 * Purpose: unit tests of `StorePolicySourceDriver` over `MemoryPolicySnapshotStoreDriver`: it is a `PolicySource`; it
 *          answers the stored snapshot and an empty one for an unknown principal; the store keeps only newer versions;
 *          snapshots are partitioned by tenant, so one tenant's never answers in another (STA-815).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decisions 1 to 4); ADR 0407.
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
  realm: Realm.Staff,
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

describe("StorePolicySourceDriver per tenant (STA-815)", () => {
  it("reads under the principal's tenant and never another's", async () => {
    const store = new MemoryPolicySnapshotStoreDriver();
    const source = new StorePolicySourceDriver(store);
    const inAcme: Actor = { ...rana, scopeId: "ten_acme" };
    const inGlobex: Actor = { ...rana, scopeId: "ten_globex" };
    expect(await store.write(rana.id, at(3), "ten_acme")).toBe(true);
    expect((await source.snapshot(inAcme)).version).toBe(3);
    expect((await source.snapshot(inGlobex)).version).toBe(0);
    expect((await source.snapshot(rana)).version).toBe(0);
    expect(await store.write(rana.id, at(1), "ten_globex")).toBe(true);
    expect((await source.snapshot(inGlobex)).version).toBe(1);
  });
});
