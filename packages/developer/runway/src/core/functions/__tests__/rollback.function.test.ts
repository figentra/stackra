/**
 * Stackra file contract:
 * Purpose: unit tests of `rollback`: every production target returns to its own earlier record in release order; a
 *          target with no earlier record refuses before anything changes; a down target does not stop the rollback:
 *          every target goes back, then one error names each down target.
 * Boundary: test only; the providers are fakes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0170 (rollback), ADR 0352 (decision 3).
 */
import { HealthStatus } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RunwayDeployFailedError } from "#core/errors/runway-deploy-failed.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { rollback } from "#core/functions/rollback.function";
import { DEPLOY_ROOT } from "#core/functions/__tests__/fixtures/deploy-root.fixture";
import { FakeProvider } from "#core/functions/__tests__/fixtures/fake-provider.fixture";
import type { DeployRecord } from "#core/types/deploy-record.type";

const OLD = "d".repeat(40);

/** The earlier release's records. */
const PREVIOUS: DeployRecord[] = [
  { target: "production/services/ksa", sha: OLD, reference: OLD },
  { target: "production/services/ksa/dedicated:firm", sha: OLD, reference: OLD },
  { target: "production/mobile/ksa", sha: OLD, reference: "update-group-1" },
];

describe("rollback", () => {
  it("returns every target to its earlier record", async () => {
    const encore = new FakeProvider("encore-cloud");
    const eas = new FakeProvider("eas");

    const results = await rollback(DEPLOY_ROOT, "production", PREVIOUS, [encore, eas]);

    expect(encore.calls).toEqual([
      `rollback production/services/ksa ${OLD}`,
      `rollback production/services/ksa/dedicated:firm ${OLD}`,
    ]);
    expect(results.map((result) => result.record)).toEqual(PREVIOUS);
  });

  it("refuses before changing anything when a target has no earlier record", async () => {
    const encore = new FakeProvider("encore-cloud");
    const eas = new FakeProvider("eas");
    await expect(
      rollback(DEPLOY_ROOT, "production", PREVIOUS.slice(0, 2), [encore, eas]),
    ).rejects.toThrow(RunwayUnresolvedError);
    expect(encore.calls).toEqual([]);
  });

  it("rolls every target back before it throws, naming each target that is down", async () => {
    const encore = new FakeProvider("encore-cloud");
    const eas = new FakeProvider("eas");
    encore.statuses.set("production/services/ksa", HealthStatus.Down);
    eas.statuses.set("production/mobile/ksa", HealthStatus.Down);
    const failure = rollback(DEPLOY_ROOT, "production", PREVIOUS, [encore, eas]);
    await expect(failure).rejects.toThrow(RunwayDeployFailedError);
    await expect(failure).rejects.toMatchObject({
      target: "production/services/ksa, production/mobile/ksa",
      results: PREVIOUS.map((record) => ({ record })),
    });
    // The first target is down, and the ones after it are still rolled back.
    expect(encore.calls).toEqual([
      `rollback production/services/ksa ${OLD}`,
      `rollback production/services/ksa/dedicated:firm ${OLD}`,
    ]);
    expect(eas.calls).toEqual([`rollback production/mobile/ksa ${OLD}`]);
  });
});
