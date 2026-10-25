/**
 * Stackra file contract:
 * Purpose: unit tests of `advanceWorkflows`: each call adds to the engine's time offset and ticks at the clock plus the
 *          offset until a tick advances nothing; it refuses before any app compiled.
 * Boundary: test only; a recording engine stands in for the native one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import type { Clock } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { NativeWorkflowRunnerDriver } from "#core/index";
import { CURRENT_WORKFLOWS } from "#testing/constants/current-workflows.constant";
import { advanceWorkflows } from "#testing/functions/advance-workflows.function";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

describe(advanceWorkflows, () => {
  it("ticks at the clock plus the growing offset until nothing advances", async () => {
    const ticks: Date[] = [];
    const answers = [2, 0, 0];
    const runner = {
      tick: async (at: Date) => {
        ticks.push(at);
        return answers.shift() ?? 0;
      },
    } as unknown as NativeWorkflowRunnerDriver;
    CURRENT_WORKFLOWS.value = { runner, clock: { now: () => new Date(NOON) } as Clock, offset: 0 };

    await advanceWorkflows(60_000);
    await advanceWorkflows(60_000);

    expect(ticks.map((at) => at.getTime() - NOON.getTime())).toEqual([60_000, 60_000, 120_000]);
  });

  it("refuses before any testing app compiled", async () => {
    CURRENT_WORKFLOWS.value = undefined;
    await expect(advanceWorkflows(0)).rejects.toThrow(/No testing app/);
  });
});
