/**
 * Stackra file contract:
 * Purpose: unit tests of `observabilityPlan`: the template's runways give staging and production heartbeats, the
 *          30-day and 13-month retention, one Sentry project per app that names one and two indicators per service;
 *          the section's defaults and switches apply; no provider means no telemetry or Sentry block; and every
 *          failure is reported at once.
 * Boundary: test only; pure function, no Pulumi.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0184 (decisions 1 to 6); ADR 0296 (enforcement).
 */
import type { RunwayIssue } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { appRunway, rootRunway, TEMPLATE_ROOT } from "#core/__tests__/fixtures/runways.fixture";
import { HeartbeatKind } from "#core/enums/heartbeat-kind.enum";
import { SliKind } from "#core/enums/sli-kind.enum";
import { ObservabilityConfigInvalidError } from "#core/errors/observability-config-invalid.error";
import { observabilityPlan } from "#core/functions/observability-plan.function";

/** The issues `run` throws in an `ObservabilityConfigInvalidError`. */
function issuesOf(run: () => unknown): readonly RunwayIssue[] {
  try {
    run();
  } catch (error) {
    if (error instanceof ObservabilityConfigInvalidError) return error.issues;
    throw error;
  }
  throw new Error("Expected an ObservabilityConfigInvalidError");
}

describe("observabilityPlan", () => {
  it("plans the template's telemetry", () => {
    const plan = observabilityPlan(rootRunway(TEMPLATE_ROOT), {
      apps: { web: appRunway("acme-web"), mobile: appRunway("acme-mobile"), docs: appRunway() },
      services: ["commerce", "notifications"],
      heartbeats: [
        {
          service: "commerce",
          kind: HeartbeatKind.Cron,
          name: "nightly-export",
          periodSeconds: 86_400,
        },
        { service: "notifications", kind: HeartbeatKind.Relay, name: "outbox", periodSeconds: 60 },
      ],
    });

    const beats = (environment: string) => [
      {
        environment,
        service: "commerce",
        kind: "cron",
        name: "nightly-export",
        periodSeconds: 86_400,
        graceSeconds: 17_280,
      },
      {
        environment,
        service: "notifications",
        kind: "relay",
        name: "outbox",
        periodSeconds: 60,
        graceSeconds: 12,
      },
    ];
    const indicators = (service: string) => [
      {
        service,
        kind: SliKind.Availability,
        metric: "http.server.request.duration",
        goodWhen: "http.response.status_code < 500",
      },
      {
        service,
        kind: SliKind.Latency,
        metric: "http.server.request.duration",
        quantiles: [0.95, 0.99],
      },
    ];
    expect(plan).toEqual({
      project: "acme-platform",
      environments: ["staging", "production"],
      telemetry: { hotDays: 30, coldMonths: 13 },
      heartbeats: [...beats("staging"), ...beats("production")],
      sentry: {
        org: "acme",
        projects: [
          { member: "web", slug: "acme-web" },
          { member: "mobile", slug: "acme-mobile" },
        ],
      },
      slis: [...indicators("commerce"), ...indicators("notifications")],
      slos: { startAt: "first-paying-tenant" },
      statusPage: null,
    });
  });

  it("plans the status page the runway declares, for monitored environments only", () => {
    const page = {
      subdomain: "acme-status",
      companyName: "Acme",
      companyUrl: "https://acme.example",
      timezone: "Asia/Riyadh",
      published: true,
      environments: ["production"],
    };
    const plan = observabilityPlan(
      rootRunway({
        providers: { betterstack: {} },
        environments: { staging: {}, production: {} },
        observability: { statusPage: page },
      }),
      { apps: {}, services: [] },
    );
    expect(plan.statusPage).toEqual({ ...page, customDomain: null });

    const run = () =>
      observabilityPlan(
        rootRunway({
          environments: { dev: {}, production: {} },
          observability: { statusPage: { ...page, environments: ["dev"] } },
        }),
        { apps: {}, services: [] },
      );
    expect(issuesOf(run).map((issue) => issue.path)).toEqual([
      "root.providers.betterstack",
      "root.providers.betterstack",
      "root.observability.statusPage.environments",
    ]);
  });

  it("applies the ADR 0184 defaults and drops a kind whose switch is off", () => {
    const plan = observabilityPlan(
      rootRunway({
        providers: { betterstack: {} },
        environments: { dev: {}, production: {} },
        observability: { logs: { coldMonths: 0 }, heartbeats: { workers: false } },
      }),
      {
        apps: {},
        services: ["commerce"],
        heartbeats: [
          { service: "commerce", kind: HeartbeatKind.Worker, name: "queue", periodSeconds: 60 },
          { service: "commerce", kind: HeartbeatKind.Cron, name: "sweep", periodSeconds: 3_600 },
        ],
      },
    );

    expect(plan.environments).toEqual(["production"]);
    expect(plan.telemetry).toEqual({ hotDays: 30, coldMonths: 0 });
    expect(plan.heartbeats.map((beat) => beat.name)).toEqual(["sweep"]);
    expect(plan.slos).toEqual({ startAt: "first-paying-tenant" });
  });

  it("plans no telemetry or Sentry block without their providers", () => {
    const plan = observabilityPlan(rootRunway({ environments: { staging: {} } }), {
      apps: { web: appRunway() },
      services: ["commerce"],
    });

    expect(plan.telemetry).toBeNull();
    expect(plan.sentry).toBeNull();
    expect(plan.heartbeats).toEqual([]);
    expect(plan.slis).toHaveLength(2);
  });

  it("refuses heartbeats or retention without Better Stack", () => {
    const run = () =>
      observabilityPlan(rootRunway({ environments: { staging: {} } }), {
        apps: {},
        services: ["commerce"],
        heartbeats: [
          { service: "commerce", kind: HeartbeatKind.Cron, name: "sweep", periodSeconds: 60 },
        ],
      });

    expect(issuesOf(run).map((issue) => issue.path)).toEqual(["root.providers.betterstack"]);
  });

  it("refuses an organization given as a ref", () => {
    const run = () =>
      observabilityPlan(rootRunway({ providers: { sentry: { org: "ref:sentry.org" } } }), {
        apps: { web: appRunway("acme-web") },
        services: [],
      });

    expect(issuesOf(run)).toEqual([
      {
        path: "root.providers.sentry.org",
        message: "Expected the organization slug (public, never a ref:)",
      },
    ]);
  });

  it("reports every failure at once", () => {
    const run = () =>
      observabilityPlan(
        rootRunway({
          providers: { betterstack: {} },
          observability: { logs: { hotDays: 0, hotDay: 3 }, slos: { startAt: "now" } },
        }),
        {
          apps: {
            web: appRunway("acme-web"),
            admin: appRunway("acme-web"),
            shop: appRunway("Bad Slug"),
          },
          services: ["commerce"],
          heartbeats: [
            { service: "ledger", kind: HeartbeatKind.Cron, name: "nightly", periodSeconds: 60 },
            { service: "commerce", kind: HeartbeatKind.Cron, name: "Nightly", periodSeconds: 60 },
            { service: "commerce", kind: HeartbeatKind.Cron, name: "sweep", periodSeconds: 10 },
            { service: "commerce", kind: HeartbeatKind.Cron, name: "sweep", periodSeconds: 60 },
          ],
        },
      );

    expect(
      issuesOf(run)
        .map((issue) => issue.path)
        .sort(),
    ).toEqual([
      "apps.admin.telemetry.sentryProject",
      "apps.shop.telemetry.sentryProject",
      "heartbeats.0.service",
      "heartbeats.1.name",
      "heartbeats.2.periodSeconds",
      "heartbeats.3.name",
      "root.observability.logs",
      "root.observability.logs.hotDays",
      "root.observability.slos.startAt",
      "root.providers.sentry.org",
    ]);
  });
});
