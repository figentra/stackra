/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the two ports and `Misfire` are its only values, and a
 *          stored schedule carries its scope, key, cron, time zone and policy.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";

describe("@stackra/scheduler/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["CronScopes", "Misfire", "ScheduleDriver"]);
  });

  it("types a stored schedule", () => {
    expectTypeOf<contracts.Schedule["id"]>().toEqualTypeOf<PublicId<"sch">>();
    expectTypeOf<contracts.Schedule["scope"]>().toEqualTypeOf<ScopeRef>();
    expectTypeOf<contracts.Schedule["misfire"]>().toEqualTypeOf<contracts.Misfire>();
    expectTypeOf<contracts.Schedule["createdAt"]>().toEqualTypeOf<Date>();
  });
});
