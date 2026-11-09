/**
 * Stackra file contract:
 * Purpose: unit tests of `maintainChangeLog`: it maintains the partitions, then deletes the expired entries left behind
 *          per owner in that owner's isolation, refuses an owned entry with no isolation, and refuses an entry claimed
 *          again after its delete rather than loop.
 * Boundary: test only; the memory feed, and a stand-in feed whose claims a test sets, with a recording isolation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 and ADR 0221 (2026-10-28 amendment); ADR 0239 (2026-11-07
 *                     amendment, gap A).
 */
import type { CallIsolation } from "@stackra/actions/contracts";
import { Duration } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RowChangeKind } from "#contracts/index";
import type { ChangeClaim, ChangeFeed } from "#contracts/index";
import { MemoryChangeFeedDriver } from "#core/drivers/memory-change-feed.driver";
import { ClaimNotLoadedError } from "#core/errors/claim-not-loaded.error";
import { RowIsolationMissingError } from "#core/errors/row-isolation-missing.error";
import { maintainChangeLog } from "#core/functions/maintain-change-log.function";

const NOON = new Date(Date.UTC(2026, 10, 8, 12));

/** A feed whose maintenance reports `report` and whose expired claims are `claims`, recording each delete's owner. */
function feedOf(
  claims: readonly ChangeClaim[],
  removed: [string | undefined, readonly string[]][],
  owner: () => string | undefined,
) {
  return {
    maintain: async () => ({ created: 3, dropped: 1 }),
    expired: async () => claims,
    remove: async (positions: readonly string[]) => {
      removed.push([owner(), positions]);
    },
  } as unknown as ChangeFeed;
}

describe("maintainChangeLog", () => {
  it("maintains the memory feed and leaves nothing expired", async () => {
    const feed = new MemoryChangeFeedDriver();
    await feed.append([
      {
        change: { model: "Order", id: "ord_1", kind: RowChangeKind.Created, fields: [] },
        meta: {},
        occurredAt: new Date(NOON.getTime() - 2 * 86_400_000),
      },
    ]);
    await expect(maintainChangeLog(feed, NOON, Duration.days(1))).resolves.toEqual({
      created: 0,
      dropped: 1,
    });
    expect(feed.stored()).toEqual([]);
  });

  it("deletes the expired entries per owner in its isolation", async () => {
    let current: string | undefined;
    const isolation = {
      run: async (actor: Actor, _scope: unknown, work: () => Promise<unknown>) => {
        current = actor.scopeId;
        try {
          return await work();
        } finally {
          current = undefined;
        }
      },
    } as unknown as CallIsolation;
    const removed: [string | undefined, readonly string[]][] = [];
    const feed = feedOf(
      [
        { position: "1:1", ownerId: "scp_acme" },
        { position: "1:2" },
        { position: "1:3", ownerId: "scp_acme" },
      ],
      removed,
      () => current,
    );
    await expect(maintainChangeLog(feed, NOON, Duration.days(1), isolation)).resolves.toEqual({
      created: 3,
      dropped: 1,
    });
    expect(removed).toEqual([
      ["scp_acme", ["1:1", "1:3"]],
      [undefined, ["1:2"]],
    ]);
    await expect(maintainChangeLog(feed, NOON, Duration.days(1))).rejects.toBeInstanceOf(
      RowIsolationMissingError,
    );
  });

  it("refuses an entry claimed again after its delete, never looping", async () => {
    const full = Array.from({ length: 500 }, (_, index) => ({ position: `1:${index}` }));
    await expect(
      maintainChangeLog(
        feedOf(full, [], () => undefined),
        NOON,
        Duration.days(1),
      ),
    ).rejects.toBeInstanceOf(ClaimNotLoadedError);
  });
});
