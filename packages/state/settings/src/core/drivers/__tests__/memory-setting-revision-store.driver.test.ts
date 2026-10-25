/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySettingRevisionStoreDriver`: append gives ids, find, list per holder newest first, due
 *          answers scheduled revisions up to a time oldest first, update moves a revision and refuses an unknown id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 5).
 */
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SettingRevisionStatus, SettingRevisionStore } from "#contracts/index";
import type { SettingRevision } from "#contracts/index";
import { MemorySettingRevisionStoreDriver } from "#core/drivers/memory-setting-revision-store.driver";

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

/** A revision of `orders` at ACME. */
const draft = (patch: Partial<SettingRevision> = {}): Omit<SettingRevision, "id"> => ({
  group: "orders",
  target: { scope: ACME },
  values: { a: 1 },
  removed: [],
  previous: {},
  author: "usr_a",
  reason: null,
  environment: "live",
  breakGlass: false,
  status: SettingRevisionStatus.Applied,
  effectiveAt: "2026-10-25T10:00:00.000Z",
  createdAt: "2026-10-25T10:00:00.000Z",
  decidedBy: null,
  appliedAt: null,
  ...patch,
});

describe(MemorySettingRevisionStoreDriver, () => {
  it("is a SettingRevisionStore that appends with ids and finds them", async () => {
    const store = new MemorySettingRevisionStoreDriver();
    expect(store).toBeInstanceOf(SettingRevisionStore);
    const first = await store.append(draft());
    expect(first.id).toBe("rev_1");
    await expect(store.find("rev_1")).resolves.toEqual(first);
    await expect(store.find("rev_9")).resolves.toBeNull();
  });

  it("lists a holder's revisions of a group newest first", async () => {
    const store = new MemorySettingRevisionStoreDriver();
    await store.append(draft());
    await store.append(draft({ values: { a: 2 } }));
    await store.append(draft({ target: {} }));
    await store.append(draft({ group: "checkout" }));
    const listed = await store.list("orders", { scope: ACME });
    expect(listed.map((revision) => revision.id)).toEqual(["rev_2", "rev_1"]);
  });

  it("answers due scheduled revisions oldest first", async () => {
    const store = new MemorySettingRevisionStoreDriver();
    await store.append(draft({ status: "scheduled", effectiveAt: "2026-10-26T00:00:00.000Z" }));
    await store.append(draft({ status: "scheduled", effectiveAt: "2026-10-25T12:00:00.000Z" }));
    await store.append(draft({ status: "scheduled", effectiveAt: "2026-11-01T00:00:00.000Z" }));
    await store.append(draft({ status: "pending", effectiveAt: "2026-10-01T00:00:00.000Z" }));
    const due = await store.due("2026-10-27T00:00:00.000Z");
    expect(due.map((revision) => revision.id)).toEqual(["rev_2", "rev_1"]);
  });

  it("updates a revision and refuses an unknown one", async () => {
    const store = new MemorySettingRevisionStoreDriver();
    await store.append(draft({ status: "pending" }));
    const moved = await store.update("rev_1", { status: "rejected", decidedBy: "usr_b" });
    expect(moved).toMatchObject({ status: "rejected", decidedBy: "usr_b" });
    await expect(store.update("rev_9", { status: "applied" })).rejects.toThrow(TypeError);
  });
});
