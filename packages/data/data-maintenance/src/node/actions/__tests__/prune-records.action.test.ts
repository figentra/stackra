/**
 * Stackra file contract:
 * Purpose: unit tests of `PruneRecordsAction`: a system-only nightly job run once per scope, which runs
 *          `pruneAllRecords` at the call's instant, audits each model that changed and reports the totals.
 * Boundary: test only; `pruneAllRecords` is mocked and the action context is fake, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rule 28); ADR 0134 (decision 3); ADR 0462 (decision 1).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { pruneAllRecords } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PruneRecordsAction } from "#node/actions/prune-records.action";
import { PruneRecordsInput } from "#node/schemas/prune-records-input.schema";

vi.mock("@stackra/database", () => ({
  pruneAllRecords: vi.fn(async () => [
    { model: "Thread", expired: 3, purged: 1, held: 1 },
    { model: "Note", expired: 0, purged: 0, held: 0 },
  ]),
}));

const NOW = new Date("2026-10-28T03:00:00Z");

describe("PruneRecordsAction", () => {
  it("is a system-only nightly job, once per scope", () => {
    expect(kindOf(PruneRecordsAction)?.options).toMatchObject({
      key: "record.prune",
      actors: [ActorKind.System],
      job: { unique: true, timeout: "10m", cron: { schedule: "0 3 * * *", perScope: true } },
    });
  });

  it("prunes every retained model, auditing only those that changed", async () => {
    const ctx = fakeActionContext({ now: () => new Date(NOW) });
    const output = await new PruneRecordsAction().handle(PruneRecordsInput.create({}), ctx);
    expect(pruneAllRecords).toHaveBeenCalledWith(NOW);
    expect({ ...output }).toEqual({ expired: 3, purged: 1, held: 1 });
    expect(ctx.recorded.audit).toEqual({ Thread: { expired: 3, purged: 1, held: 1 } });
  });
});
