/**
 * Stackra file contract:
 * Purpose: unit tests of `pruneOutbox`: it prunes dead letters and inbox ids older than `days` before `now`, with one
 *          cutoff for both, and reports how many dead letters went.
 * Boundary: test only; the memory outbox and a recording inbox.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; data-layer gap gov6.
 */
import { describe, expect, it } from "@stackra/testing";

import { MessageKind } from "#contracts/index";
import type { InboxDriver } from "#contracts/index";
import { MemoryOutboxDriver } from "#core/drivers/memory-outbox.driver";
import { pruneOutbox } from "#core/functions/prune-outbox.function";

const NOW = new Date("2026-10-28T00:00:00Z");

describe("pruneOutbox", () => {
  it("prunes dead letters and inbox ids older than the window", async () => {
    const outbox = new MemoryOutboxDriver();
    const at = new Date("2026-10-01T00:00:00Z");
    await outbox.write([
      {
        id: "evt_A",
        kind: MessageKind.Event,
        type: "orders.order.paid.v1",
        data: {},
        meta: {},
        occurredAt: at,
        attempts: 0,
        availableAt: at,
      },
    ]);
    await outbox.deadLetter("evt_A", { code: "internal", message: "down" }, at);
    const pruned: Date[] = [];
    const inbox = {
      prune: async (before: Date) => {
        pruned.push(before);
      },
    } as unknown as InboxDriver;
    expect(await pruneOutbox(outbox, inbox, 10, NOW)).toEqual({ dead: 1 });
    expect(pruned).toEqual([new Date("2026-10-18T00:00:00Z")]);
    expect(outbox.stored()).toEqual([]);
  });
});
