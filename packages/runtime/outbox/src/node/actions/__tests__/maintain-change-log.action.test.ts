/**
 * Stackra file contract:
 * Purpose: unit tests of `MaintainChangeLogAction`: a system-only daily job, which maintains the change log at the
 *          call's instant with the configured retention and reports the counts.
 * Boundary: test only; the action is called directly with the memory change feed, the configuration built with a
 *           one-day window and a fake action context whose clock is fixed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rule 28); ADR 0078 and ADR 0221 (2026-10-28 amendment).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { OutboxConfig } from "#config/outbox.config";
import { RowChangeKind } from "#contracts/index";
import { MemoryChangeFeedDriver } from "#core/drivers/memory-change-feed.driver";
import { MaintainChangeLogAction } from "#node/actions/maintain-change-log.action";
import { MaintainChangeLogInput } from "#node/schemas/maintain-change-log-input.schema";
import { MaintainChangeLogOutput } from "#node/schemas/maintain-change-log-output.schema";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

describe("MaintainChangeLogAction", () => {
  it("is a system-only daily job", () => {
    const options = kindOf(MaintainChangeLogAction)?.options;
    expect(options?.["key"]).toBe("change_log.maintain");
    expect(options?.["actors"]).toEqual([ActorKind.System]);
    expect(options?.["job"]).toEqual({
      unique: true,
      timeout: "5m",
      cron: { schedule: "30 2 * * *" },
    });
  });

  it("drops what the configured retention no longer keeps", async () => {
    const feed = new MemoryChangeFeedDriver();
    await feed.append([
      {
        change: { model: "Product", id: "prd_1", kind: RowChangeKind.Created, fields: [] },
        meta: {},
        occurredAt: new Date(NOON.getTime() - 2 * 86_400_000),
      },
    ]);
    const action = new MaintainChangeLogAction(
      feed,
      buildConfig(OutboxConfig, { values: { changeRetentionDays: 1 } }),
    );
    const output = await action.handle(
      MaintainChangeLogInput.create({}),
      fakeActionContext({ now: () => new Date(NOON) }),
    );
    expect(output).toBeInstanceOf(MaintainChangeLogOutput);
    expect({ ...output }).toEqual({ created: 0, dropped: 1 });
    expect(feed.stored()).toEqual([]);
  });
});
