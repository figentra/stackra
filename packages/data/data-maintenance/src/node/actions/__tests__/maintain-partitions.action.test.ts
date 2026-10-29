/**
 * Stackra file contract:
 * Purpose: unit tests of `MaintainPartitionsAction`: a system-only daily job, which runs `maintainAllPartitions` at
 *          the call's instant, audits each table's partition names and reports the totals.
 * Boundary: test only; `maintainAllPartitions` is spied on and the action context is fake, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rule 28); data-layer gaps db12, sc4; ADR 0462 (decision 1).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
// oxlint-disable-next-line no-restricted-imports -- the namespace object is what vi.spyOn replaces a member of
import * as database from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MaintainPartitionsAction } from "#node/actions/maintain-partitions.action";
import { MaintainPartitionsInput } from "#node/schemas/maintain-partitions-input.schema";

// A spy on the namespace, not vi.mock: the generated setup's registrations load this job before the test file, so
// the action already holds the real module and a vi.mock factory would never reach it.
const maintainAllPartitions = vi.spyOn(database, "maintainAllPartitions").mockResolvedValue([
  { table: "app.hits", created: ["hits_p20261101"], dropped: ["hits_p20260801"], held: [] },
  { table: "app.audit", created: [], dropped: [], held: ["audit_p20260701"] },
]);

const NOW = new Date("2026-10-28T02:15:00Z");

describe("MaintainPartitionsAction", () => {
  it("is a system-only daily job", () => {
    expect(kindOf(MaintainPartitionsAction)?.options).toMatchObject({
      key: "partition.maintain",
      actors: [ActorKind.System],
      job: { unique: true, timeout: "10m", cron: { schedule: "15 2 * * *" } },
    });
  });

  it("maintains every partitioned table, auditing each", async () => {
    const ctx = fakeActionContext({ now: () => new Date(NOW) });
    const output = await new MaintainPartitionsAction().handle(
      MaintainPartitionsInput.create({}),
      ctx,
    );
    expect(maintainAllPartitions).toHaveBeenCalledWith(NOW);
    expect({ ...output }).toEqual({ created: 1, dropped: 1, held: 1 });
    expect(ctx.recorded.audit).toEqual({
      "app.hits": { created: ["hits_p20261101"], dropped: ["hits_p20260801"], held: [] },
      "app.audit": { created: [], dropped: [], held: ["audit_p20260701"] },
    });
  });
});
