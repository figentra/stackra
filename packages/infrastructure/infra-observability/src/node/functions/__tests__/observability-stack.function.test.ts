/**
 * Stackra file contract:
 * Purpose: unit tests of `observabilityStack`: a full plan declares the log pipeline, the Sentry projects and the
 *          heartbeats and exports values under the `ref:` paths the runways name; a plan without the telemetry and
 *          Sentry blocks declares only its heartbeats and still exports the indicators; a status page shows each
 *          heartbeat and uptime monitor of its environments in that environment's section and exports its id.
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
  uptime: [
    {
      environment: "production",
      name: "registry",
      url: "https://npm.acme.example/-/ping",
      checkFrequencySeconds: 60,
      expectedStatusCodes: null,
    },
  ],
  statusPage: null,
};

describe("observabilityStack", () => {
  it("declares every part and exports the values the runways name", async () => {
    const stack = observabilityStack(PLAN);
    await settled(stack);

    const { outputs } = stack;
    expect(await valueOf(outputs.otlp?.endpoint)).toBe(
      "https://telemetry-acme-platform.ingest.test",
    );
    expect(await valueOf(outputs.betterstack?.source)).toBe("telemetry-acme-platform-id");
    expect(await valueOf(outputs.sentry?.dsn["web"])).toBe(
      "https://sentry-acme-web-key@sentry.test/1",
    );
    expect(await valueOf(outputs.heartbeats["production"]?.["commerce"]?.["outbox"])).toBe(
      "https://uptime.betterstack.test/heartbeat-production.commerce.outbox",
    );
    expect(outputs.slis).toBe(PLAN.slis);
    expect(new Set(declared.map((resource) => resource.type.split(":")[0]))).toEqual(
      new Set(["aws", "logtail", "sentry", "better-uptime"]),
    );
  });

  it("declares only what the plan holds", async () => {
    const stack = observabilityStack({
      ...PLAN,
      telemetry: null,
      sentry: null,
      heartbeats: [],
      uptime: [],
    });
    await settled(stack);

    expect(stack.logs).toBeUndefined();
    expect(stack.sentry).toBeUndefined();
    expect(stack.outputs).toEqual({ heartbeats: {}, slis: PLAN.slis });
    expect(declared).toEqual([]);
  });

  it("puts each heartbeat of the page's environments in that environment's section", async () => {
    const stack = observabilityStack({
      ...PLAN,
      statusPage: {
        subdomain: "acme-status",
        companyName: "Acme",
        companyUrl: "https://acme.example",
        timezone: "Asia/Riyadh",
        customDomain: "status.acme.example",
        published: false,
        environments: ["production"],
      },
    });
    await settled(stack);

    const page = declared.find((resource) => resource.type.endsWith("StatusPage"));
    expect(page?.inputs).toEqual({
      companyName: "Acme",
      companyUrl: "https://acme.example",
      subdomain: "acme-status",
      timezone: "Asia/Riyadh",
      published: false,
      customDomain: "status.acme.example",
    });
    const section = declared.find((resource) => resource.type.endsWith("StatusPageSection"));
    expect(section?.inputs).toMatchObject({ name: "production", position: 0 });
    const entries = declared.filter((resource) => resource.type.endsWith("StatusPageResource"));
    expect(entries).toHaveLength(2);
    expect(entries.map((resource) => resource.inputs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ resourceType: "Heartbeat", publicName: "commerce outbox" }),
        expect.objectContaining({ resourceType: "Monitor", publicName: "registry" }),
      ]),
    );
    const { statusPage } = stack.outputs;
    if (!statusPage) throw new Error("the status page was not exported");
    expect(await valueOf(statusPage.id)).toBe("status-acme-platform-id");
  });
});
