/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryReplicaLogDriver`: append returns the head; a read after a position returns the later
 *          changes and nothing older, pages by `limit` with `more`, keeps partitions apart, returns only entries within
 *          the caller's scope (while its position passes the others), and answers `undefined` above the head.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0338 (decision 3 and its enforcement: a stale cursor receives
 *                     every change since it and nothing older; a scoped replica never receives a record outside it).
 */
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ReplicaLog } from "#contracts/index";
import { MemoryReplicaLogDriver } from "#core/drivers/memory-replica-log.driver";

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const EU: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme.shop_eu" };
const OTHER: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w9", path: "platform.acmex" };

describe("MemoryReplicaLogDriver", () => {
  it("is a ReplicaLog", () => {
    expect(new MemoryReplicaLogDriver()).toBeInstanceOf(ReplicaLog);
  });

  it("returns every change after a position and nothing older, page by page", async () => {
    const log = new MemoryReplicaLogDriver();
    expect(await log.head("p")).toBe(0);
    expect(
      await log.append(
        "p",
        [
          { id: "sal_1", row: 1 },
          { id: "sal_2", row: 2 },
        ],
        EU,
      ),
    ).toBe(2);
    expect(await log.append("p", [{ id: "sal_1" }], EU)).toBe(3);
    expect(await log.read("p", 1, 10, undefined)).toEqual({
      changes: [{ id: "sal_2", row: 2 }, { id: "sal_1" }],
      position: 3,
      more: false,
    });
    expect(await log.read("p", 0, 2, undefined)).toEqual({
      changes: [
        { id: "sal_1", row: 1 },
        { id: "sal_2", row: 2 },
      ],
      position: 2,
      more: true,
    });
    expect(await log.read("p", 3, 10, undefined)).toEqual({
      changes: [],
      position: 3,
      more: false,
    });
    expect(await log.read("p", 4, 10, undefined)).toBeUndefined();
    expect(await log.read("q", 0, 10, undefined)).toEqual({
      changes: [],
      position: 0,
      more: false,
    });
  });

  it("returns only entries within the caller's scope", async () => {
    const log = new MemoryReplicaLogDriver();
    await log.append("p", [{ id: "sal_1" }], EU);
    await log.append("p", [{ id: "sal_2" }], OTHER);
    await log.append("p", [{ id: "sal_3" }], undefined);
    await log.append("p", [{ id: "sal_4" }], ACME);
    expect((await log.read("p", 0, 10, ACME))?.changes).toEqual([{ id: "sal_1" }, { id: "sal_4" }]);
    expect(await log.read("p", 0, 10, EU)).toEqual({
      changes: [{ id: "sal_1" }],
      position: 4,
      more: false,
    });
    expect((await log.read("p", 0, 10, undefined))?.changes).toHaveLength(4);
  });
});
