/**
 * Stackra file contract:
 * Purpose: unit tests of `PruneOutboxAction`: a system-only daily job, which prunes dead letters and inbox ids older
 *          than `pruneAfterDays` before the call's instant and reports how many dead letters went.
 * Boundary: test only; the memory outbox, a recording inbox, the configuration built with a ten-day window and a fake
 *           action context whose clock is fixed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rule 28); data-layer gap gov6.
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { OutboxConfig } from "#config/outbox.config";
import { MessageKind } from "#contracts/index";
import type { InboxDriver } from "#contracts/index";
import { MemoryOutboxDriver } from "#core/drivers/memory-outbox.driver";
import { PruneOutboxAction } from "#node/actions/prune-outbox.action";
import { PruneOutboxInput } from "#node/schemas/prune-outbox-input.schema";

const NOW = new Date("2026-10-28T00:00:00Z");

describe("PruneOutboxAction", () => {
  it("is a system-only daily job", () => {
    const options = kindOf(PruneOutboxAction)?.options;
    expect(options?.["key"]).toBe("outbox_message.prune");
    expect(options?.["actors"]).toEqual([ActorKind.System]);
    expect(options?.["job"]).toEqual({
      unique: true,
      timeout: "5m",
      cron: { schedule: "15 3 * * *" },
    });
  });

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
    const action = new PruneOutboxAction(
      outbox,
      inbox,
      buildConfig(OutboxConfig, { values: { pruneAfterDays: 10 } }),
    );
    const output = await action.handle(
      PruneOutboxInput.create({}),
      fakeActionContext({ now: () => new Date(NOW) }),
    );
    expect(output.dead).toBe(1);
    expect(pruned).toEqual([new Date("2026-10-18T00:00:00Z")]);
    expect(outbox.stored()).toEqual([]);
  });
});
