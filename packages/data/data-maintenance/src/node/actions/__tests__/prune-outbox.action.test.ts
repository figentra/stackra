/**
 * Stackra file contract:
 * Purpose: unit tests of `PruneOutboxAction`: a system-only daily job, which runs `pruneOutbox` with the configured
 *          `pruneAfterDays` before the call's instant and reports how many dead letters went.
 * Boundary: test only; a recording outbox and inbox, the configuration built with a ten-day window and a fake action
 *           context whose clock is fixed. The prune itself is tested in @stackra/outbox.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rule 28); data-layer gap gov6; ADR 0462 (decision 1).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { OutboxConfig } from "@stackra/outbox";
import type { InboxDriver, OutboxDriver } from "@stackra/outbox/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PruneOutboxAction } from "#node/actions/prune-outbox.action";
import { PruneOutboxInput } from "#node/schemas/prune-outbox-input.schema";

describe("PruneOutboxAction", () => {
  it("is a system-only daily job", () => {
    expect(kindOf(PruneOutboxAction)?.options).toMatchObject({
      key: "outbox_message.prune",
      actors: [ActorKind.System],
      job: { unique: true, timeout: "5m", cron: { schedule: "15 3 * * *" } },
    });
  });

  it("prunes both stores at the configured window", async () => {
    const cutoffs: Date[] = [];
    const outbox = {
      pruneDead: async (before: Date) => {
        cutoffs.push(before);
        return 2;
      },
    } as unknown as OutboxDriver;
    const inbox = {
      prune: async (before: Date) => {
        cutoffs.push(before);
      },
    } as unknown as InboxDriver;
    const output = await new PruneOutboxAction(
      outbox,
      inbox,
      buildConfig(OutboxConfig, { values: { pruneAfterDays: 10 } }),
    ).handle(
      PruneOutboxInput.create({}),
      fakeActionContext({ now: () => new Date("2026-10-28T00:00:00Z") }),
    );
    expect(output.dead).toBe(2);
    expect(cutoffs).toEqual([new Date("2026-10-18T00:00:00Z"), new Date("2026-10-18T00:00:00Z")]);
  });
});
