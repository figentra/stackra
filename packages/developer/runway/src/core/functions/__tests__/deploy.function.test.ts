/**
 * Stackra file contract:
 * Purpose: unit tests of `deploy`: every target is applied then verified in release order; a target without a provider
 *          fails before anything ships; a down target stops the release there; a short SHA is refused.
 * Boundary: test only; the providers are fakes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decision 3), OS-12.
 */
import { HealthStatus } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RunwayDeployFailedError } from "#core/errors/runway-deploy-failed.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { deploy } from "#core/functions/deploy.function";
import { DEPLOY_ROOT } from "#core/functions/__tests__/fixtures/deploy-root.fixture";
import { FakeProvider } from "#core/functions/__tests__/fixtures/fake-provider.fixture";

const SHA = "a".repeat(40);

describe("deploy", () => {
  it("applies and verifies every target in release order", async () => {
    const encore = new FakeProvider("encore-cloud");
    const eas = new FakeProvider("eas");

    const results = await deploy(DEPLOY_ROOT, "staging", SHA, [encore, eas]);

    expect(encore.calls).toEqual([`apply staging/services/uae ${SHA}`]);
    expect(eas.calls).toEqual([`apply staging/mobile/uae ${SHA}`]);
    expect(results.map((result) => result.report.status)).toEqual(["up", "up"]);
  });

  it("ships nothing when a target has no provider", async () => {
    const encore = new FakeProvider("encore-cloud");
    await expect(deploy(DEPLOY_ROOT, "staging", SHA, [encore])).rejects.toThrow(
      RunwayUnresolvedError,
    );
    expect(encore.calls).toEqual([]);
  });

  it("stops at the first target that is down", async () => {
    const encore = new FakeProvider("encore-cloud");
    const eas = new FakeProvider("eas");
    encore.statuses.set("production/services/ksa", HealthStatus.Down);

    const failure = deploy(DEPLOY_ROOT, "production", SHA, [encore, eas]);

    await expect(failure).rejects.toThrow(RunwayDeployFailedError);
    expect(encore.calls).toEqual([`apply production/services/ksa ${SHA}`]);
    expect(eas.calls).toEqual([]);
  });

  it("refuses a short SHA", async () => {
    await expect(deploy(DEPLOY_ROOT, "staging", "abc123", [])).rejects.toThrow(TypeError);
  });
});
