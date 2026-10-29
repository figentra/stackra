/**
 * Stackra file contract:
 * Purpose: unit tests of `RollUpTimeSeriesAction`: a system-only job every 15 minutes per scope, which runs
 *          `rollUpAllTimeSeries` at the call's instant, audits each rollup table's counts and reports the totals.
 * Boundary: test only; `rollUpAllTimeSeries` is spied on and the action context is fake, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rule 28); data-layer gap cdc7 (stackra-321); ADR 0462 (decision 1).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
// oxlint-disable-next-line no-restricted-imports -- the namespace object is what vi.spyOn replaces a member of
import * as database from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RollUpTimeSeriesAction } from "#node/actions/roll-up-time-series.action";
import { RollUpTimeSeriesInput } from "#node/schemas/roll-up-time-series-input.schema";

// A spy on the namespace, not vi.mock: the generated setup's registrations load this job before the test file, so
// the action already holds the real module and a vi.mock factory would never reach it.
const rollUpAllTimeSeries = vi.spyOn(database, "rollUpAllTimeSeries").mockResolvedValue([
  {
    series: "meter_readings",
    tables: [
      { table: "metering.ts_meter_readings_hour", written: 48, pruned: 2 },
      { table: "metering.ts_meter_readings_day", written: 2, pruned: 0 },
    ],
  },
]);

const NOW = new Date("2026-10-28T00:15:00Z");

describe("RollUpTimeSeriesAction", () => {
  it("is a system-only job every 15 minutes per scope", () => {
    expect(kindOf(RollUpTimeSeriesAction)?.options).toMatchObject({
      key: "timeseries.rollup",
      actors: [ActorKind.System],
      job: { unique: true, timeout: "10m", cron: { schedule: "*/15 * * * *", perScope: true } },
    });
  });

  it("rolls up every series, auditing each table", async () => {
    const ctx = fakeActionContext({ now: () => new Date(NOW) });
    const output = await new RollUpTimeSeriesAction().handle(RollUpTimeSeriesInput.create({}), ctx);
    expect(rollUpAllTimeSeries).toHaveBeenCalledWith(NOW);
    expect({ ...output }).toEqual({ written: 50, pruned: 2 });
    expect(ctx.recorded.audit).toEqual({
      "metering.ts_meter_readings_hour": { written: 48, pruned: 2 },
      "metering.ts_meter_readings_day": { written: 2, pruned: 0 },
    });
  });
});
