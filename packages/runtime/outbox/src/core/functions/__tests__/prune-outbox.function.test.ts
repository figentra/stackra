/**
 * Stackra file contract:
 * Purpose: unit tests of `pruneOutbox`: it prunes dead letters and inbox ids older than `days` before `now`, with one
 *          cutoff for both, and reports how many dead letters went; each claimed dead letter is deleted in its owner
 *          through the isolation, an owned one with no isolation is refused, and one claimed again after its delete is
 *          refused rather than looped on.
 * Boundary: test only; the memory outbox and a recording inbox.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; data-layer gap gov6.
 */
import { describe, expect, it } from "@stackra/testing";

import type { CallIsolation } from "@stackra/actions/contracts";
import type { Actor } from "@stackra/contracts";

import { MessageKind } from "#contracts/index";
import type { InboxDriver, OutboxDriver } from "#contracts/index";
import { ClaimNotLoadedError } from "#core/errors/claim-not-loaded.error";
import { RowIsolationMissingError } from "#core/errors/row-isolation-missing.error";
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

  it("deletes each claimed dead letter in its owner, and refuses an owned one with no isolation", async () => {
    const removed: [string, string | undefined][] = [];
    let owner: string | undefined;
    const outbox = {
      claimDead: async () => [
        { id: "evt_A", ownerId: "scp_acme", availableAt: NOW },
        { id: "evt_B", availableAt: NOW },
      ],
      remove: async (id: string) => {
        removed.push([id, owner]);
      },
    } as unknown as OutboxDriver;
    const isolation = {
      run: async (actor: Actor, _scope: unknown, work: () => Promise<unknown>) => {
        owner = actor.scopeId;
        try {
          return await work();
        } finally {
          owner = undefined;
        }
      },
    } as unknown as CallIsolation;
    const inbox = { prune: async () => {} } as unknown as InboxDriver;
    expect(await pruneOutbox(outbox, inbox, 10, NOW, isolation)).toEqual({ dead: 2 });
    expect(removed).toEqual([
      ["evt_A", "scp_acme"],
      ["evt_B", undefined],
    ]);
    await expect(pruneOutbox(outbox, inbox, 10, NOW)).rejects.toBeInstanceOf(
      RowIsolationMissingError,
    );
  });

  it("refuses a dead letter claimed again after its delete, never looping", async () => {
    const full = Array.from({ length: 500 }, (_, index) => ({
      id: `evt_${index}`,
      availableAt: NOW,
    }));
    const outbox = {
      claimDead: async () => full,
      remove: async () => {},
    } as unknown as OutboxDriver;
    const inbox = { prune: async () => {} } as unknown as InboxDriver;
    await expect(pruneOutbox(outbox, inbox, 10, NOW)).rejects.toBeInstanceOf(ClaimNotLoadedError);
  });
});
