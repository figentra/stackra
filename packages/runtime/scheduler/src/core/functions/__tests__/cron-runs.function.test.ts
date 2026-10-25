/**
 * Stackra file contract:
 * Purpose: unit tests of `cronRuns`: the range is `(after, until]` at whole minutes; a time zone moves the runs,
 *          whole-hour and half-hour offsets alike; the two day fields follow the classic either-or rule unless one
 *          is a star; a wall time a daylight-saving jump skips does not run; an unknown time zone throws.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0148 (decisions 4 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { cronRuns } from "#core/functions/cron-runs.function";
import { parseCron } from "#core/functions/parse-cron.function";

/** The ISO strings of runs. */
const iso = (runs: readonly Date[]): string[] => runs.map((run) => run.toISOString());

describe(cronRuns, () => {
  it("lists the runs after `after` up to and including `until`", () => {
    const runs = cronRuns(
      parseCron("0 * * * *"),
      "UTC",
      new Date("2026-10-24T09:30:00Z"),
      new Date("2026-10-24T12:00:00Z"),
    );
    expect(iso(runs)).toEqual([
      "2026-10-24T10:00:00.000Z",
      "2026-10-24T11:00:00.000Z",
      "2026-10-24T12:00:00.000Z",
    ]);
  });

  it("excludes a run at `after` itself and finds none in an empty range", () => {
    const fields = parseCron("0 * * * *");
    const ten = new Date("2026-10-24T10:00:00Z");
    expect(cronRuns(fields, "UTC", ten, new Date("2026-10-24T10:59:59Z"))).toEqual([]);
    expect(cronRuns(fields, "UTC", ten, ten)).toEqual([]);
  });

  it("reads the cron in the schedule's time zone", () => {
    const after = new Date("2026-10-24T00:00:00Z");
    const until = new Date("2026-10-25T00:00:00Z");
    expect(iso(cronRuns(parseCron("0 8 * * *"), "Asia/Dubai", after, until))).toEqual([
      "2026-10-24T04:00:00.000Z",
    ]);
    expect(iso(cronRuns(parseCron("0 9 * * *"), "Asia/Kolkata", after, until))).toEqual([
      "2026-10-24T03:30:00.000Z",
    ]);
  });

  it("runs on either day field when both are restricted, on both when one is a star", () => {
    const after = new Date("2026-09-30T23:59:00Z");
    const until = new Date("2026-10-31T23:59:00Z");
    // October 2026: Fridays are the 2nd, 9th, 16th, 23rd and 30th.
    expect(iso(cronRuns(parseCron("0 0 13 * fri"), "UTC", after, until))).toEqual([
      "2026-10-02T00:00:00.000Z",
      "2026-10-09T00:00:00.000Z",
      "2026-10-13T00:00:00.000Z",
      "2026-10-16T00:00:00.000Z",
      "2026-10-23T00:00:00.000Z",
      "2026-10-30T00:00:00.000Z",
    ]);
    expect(iso(cronRuns(parseCron("0 0 */2 * fri"), "UTC", after, until))).toEqual([
      "2026-10-09T00:00:00.000Z",
      "2026-10-23T00:00:00.000Z",
    ]);
  });

  it("skips a wall time the spring-forward jump never shows", () => {
    // New York jumps from 02:00 to 03:00 on 8 March 2026, so 02:30 runs on the 9th only.
    const runs = cronRuns(
      parseCron("30 2 * * *"),
      "America/New_York",
      new Date("2026-03-07T12:00:00Z"),
      new Date("2026-03-09T12:00:00Z"),
    );
    expect(iso(runs)).toEqual(["2026-03-09T06:30:00.000Z"]);
  });

  it("throws a RangeError for a time zone the runtime does not know", () => {
    expect(() =>
      cronRuns(
        parseCron("* * * * *"),
        "Mars/Olympus",
        new Date("2026-10-24T00:00:00Z"),
        new Date("2026-10-24T00:05:00Z"),
      ),
    ).toThrow(RangeError);
  });
});
