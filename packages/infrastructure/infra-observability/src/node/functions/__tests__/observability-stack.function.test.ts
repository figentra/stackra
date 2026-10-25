/**
 * Stackra file contract:
 * Purpose: unit tests of `observabilityStack`: a full plan declares the log pipeline, the Sentry projects and the
 *          heartbeats and exports values under the `ref:` paths the runways name; a plan without the telemetry and
 *          Sentry blocks declares only its heartbeats and still exports the indicators.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0184; ADR 0171 (decisions 4 and 6).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { HeartbeatKind } from "#core/enums/heartbeat-kind.enum";
import { SliKind } from "#core/enums/sli-kind.enum";
import type { ObservabilityPlan } from "#core/types/observability-plan.type";
import {
  mockPulumi,
  settled,
  valueOf,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";
import { observabilityStack } from "#node/functions/observability-stack.function";

let declared: DeclaredResource[];

beforeEach(async () => {
  declared = await mockPulumi();
});

const PLAN: ObservabilityPlan = {
  project: "acme-platform",
  environments: ["production"],
  telemetry: { hotDays: 30, coldMonths: 13 },
  heartbeats: [
    {
      environment: "production",
      service: "commerce",
      kind: HeartbeatKind.Relay,
      name: "outbox",
      periodSeconds: 60,
      graceSeconds: 12,
    },
  ],
  sentry: { org: "acme", projects: [{ member: "web", slug: "acme-web" }] },
  slis: [
    {
      service: "commerce",
      kind: SliKind.Availability,
      metric: "http.server.request.duration",
      goodWhen: "http.response.status_code < 500",
    },
  ],
  slos: { startAt: "first-paying-tenant" },
};

describe("observabilityStack", () => {
  it("declares every part and exports the values the runways name", async () => {
    const stack = observabilityStack(PLAN);
    await settled(stack);

    const { outputs } = stack;
    expect(await valueOf(outputs.otlp!.endpoint)).toBe(
      "https://telemetry-acme-platform.ingest.test",
    );
    expect(await valueOf(outputs.betterstack!.source)).toBe("telemetry-acme-platform-id");
    expect(await valueOf(outputs.sentry!.dsn["web"]!)).toBe(
      "https://sentry-acme-web-key@sentry.test/1",
    );
    expect(await valueOf(outputs.heartbeats["production"]!["commerce"]!["outbox"]!)).toBe(
      "https://uptime.betterstack.test/heartbeat-production.commerce.outbox",
    );
    expect(outputs.slis).toBe(PLAN.slis);
    expect(new Set(declared.map((resource) => resource.type.split(":")[0]))).toEqual(
      new Set(["aws", "logtail", "sentry", "better-uptime"]),
    );
  });

  it("declares only what the plan holds", async () => {
    const stack = observabilityStack({ ...PLAN, telemetry: null, sentry: null, heartbeats: [] });
    await settled(stack);

    expect(stack.logs).toBeUndefined();
    expect(stack.sentry).toBeUndefined();
    expect(stack.outputs).toEqual({ heartbeats: {}, slis: PLAN.slis });
    expect(declared).toEqual([]);
  });
});
