/**
 * Stackra file contract:
 * Purpose: unit tests of `PurgeAccessLogAction`: a system-only job on a nightly per-tenant cron, which deletes the
 *          records older than `retentionDays` before the call's instant, in one purge, and reports how many.
 * Boundary: test only; the action is called directly with a recording repository, the configuration built with a
 *           90-day window and a fake action context whose clock is fixed, so the cutoff is exact.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 6); ADR 0305 (rule 28).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Repository } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AccessLogConfig } from "#config/access-log.config";
import { PurgeAccessLogAction } from "#node/actions/purge-access-log.action";
import type { AccessLogEntry } from "#node/models/access-log-entry.model";
import { PurgeAccessLogInput } from "#node/schemas/purge-access-log-input.schema";
import { PurgeAccessLogOutput } from "#node/schemas/purge-access-log-output.schema";

/**
 * Guards retention: a purge that deletes too much destroys the audit trail, too little breaks the legal window.
 */
describe("PurgeAccessLogAction", () => {
  it("is a system-only job, unique per tenant, on a nightly per-tenant cron", () => {
    const options = kindOf(PurgeAccessLogAction)?.options;
    expect(options?.["key"]).toBe("access_log_entry.purge");
    expect(options?.["actors"]).toEqual([ActorKind.System]);
    expect(options?.["job"]).toEqual({
      unique: true,
      timeout: "5m",
      cron: { schedule: "30 3 * * *", perScope: true },
    });
  });

  it("deletes only the records older than retentionDays", async () => {
    const purge = vi.fn(async (_where: object) => 3);
    const action = new PurgeAccessLogAction(
      { purge } as unknown as Repository<AccessLogEntry>,
      buildConfig(AccessLogConfig, { values: { retentionDays: 90 } }),
    );
    const now = new Date("2026-10-21T00:00:00Z");

    const output = await action.handle(
      PurgeAccessLogInput.create({}),
      fakeActionContext({ now: () => new Date(now.getTime()) }),
    );

    expect(output).toBeInstanceOf(PurgeAccessLogOutput);
    expect(output.deleted).toBe(3);
    expect(purge).toHaveBeenCalledTimes(1);
    expect(purge).toHaveBeenCalledWith({ at: { $lt: new Date("2026-07-23T00:00:00Z") } });
  });
});
