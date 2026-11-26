/**
 * Stackra file contract:
 * Purpose: unit tests of `PipelineCheckService`: up when `health.ping.check` runs through the real actions
 *          pipeline as the platform actor; down when the pipeline refuses (no `AccessControl` bound) or throws; its report
 *          names an error's class, never its message.
 * Boundary: test only; the pipeline is the real `ActionPipeline` over the service's testing module (memory drivers),
 *           reached through a stand-in container whose `forRequest()` is that module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0098; ADR 0190 (health); ADR 0263 (testing modules).
 */
import { AccessControl } from "@stackra/actions/contracts";
import type { Container } from "@stackra/container";
import { createTestingModule } from "@stackra/container/testing";
import { HealthStatus } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PipelineCheckService } from "#modules/health/services/pipeline-check.service";
import { HealthModule } from "#stackra/module";

/** A stand-in container whose request container is `resolver`. */
const containerOf = (resolver: object): Container =>
  ({ forRequest: () => resolver }) as unknown as Container;

/** The pipeline check. */
describe(PipelineCheckService, () => {
  /** The port it serves names it in the probe's answer. */
  it("is the `pipeline` check", () => {
    expect(new PipelineCheckService(containerOf({})).name).toBe("pipeline");
  });

  /** The whole pipeline answers. */
  it("is up when the ping runs through the pipeline", async () => {
    const app = await createTestingModule(HealthModule).useDrivers("memory").compile();
    const report = await new PipelineCheckService(containerOf(app)).check();
    expect(report.status).toBe(HealthStatus.Up);
    expect(report.latency).toBeDefined();
    await app.close();
  });

  /** No access control: the pipeline fails closed, so it is not answering. */
  it("is down, naming the error's class, when the pipeline refuses the call", async () => {
    const bare = { has: () => false, get: () => undefined };
    const report = await new PipelineCheckService(containerOf(bare)).check();
    expect(report.status).toBe(HealthStatus.Down);
    expect(report.detail).toMatch(/^the pipeline did not answer \(\w+\)$/);
    expect(AccessControl).toBeDefined();
  });

  /** A container that cannot make a request container is a failed pipeline, not a thrown check. */
  it("is down when the request container cannot be made", async () => {
    const broken = {
      forRequest: () => {
        throw new Error("secret detail that must not leave");
      },
    } as unknown as Container;
    const report = await new PipelineCheckService(broken).check();
    expect(report.status).toBe(HealthStatus.Down);
    expect(JSON.stringify(report)).not.toContain("secret");
  });
});
