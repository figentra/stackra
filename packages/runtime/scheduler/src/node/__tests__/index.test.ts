/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the Postgres schedule driver is its only value.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { ScheduleDriver } from "#contracts/index";
import * as node from "#node/index";

describe("@stackra/scheduler/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual(["PostgresScheduleDriver"]);
  });

  it("exports a ScheduleDriver driver", () => {
    expect(node.PostgresScheduleDriver.prototype).toBeInstanceOf(ScheduleDriver);
  });
});
