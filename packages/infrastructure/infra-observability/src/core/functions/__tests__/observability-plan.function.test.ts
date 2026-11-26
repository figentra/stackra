/**
 * Stackra file contract:
 * Purpose: unit tests of `observabilityPlan`: the template's runways give staging and production heartbeats, the
 *          30-day and 13-month retention, one Sentry project per app that names one and two indicators per service;
 *          the section's defaults and switches apply; no provider means no telemetry or Sentry block; the uptime
 *          list becomes one monitor per URL of a monitored environment; every failure is reported at once; and the
 *          alerts and routes take their defaults beside a runway's own values; and each declared objective gets the
 *          four burn-rate alerts scaled to the window, with unknown, repeated or off-bucket objectives refused.
 * Boundary: test only; pure function, no Pulumi.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0184 (decisions 1 to 6); ADR 0296 (enforcement); STA-2854.
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

/** The heartbeats the plan derives for `environment`. */
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

/** The default indicators the plan derives for `service`. */
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
      slos: { startAt: "first-paying-tenant", windowDays: 30, objectives: [], burnRateAlerts: [] },
      uptime: [],
      statusPage: null,
      alerts: {
        environments: ["staging", "production"],
        errorRate: { enabled: true, threshold: 2, window: "5m", severity: "critical" },
        latencyP95: { enabled: true, threshold: 1000, window: "10m", severity: "warning" },
        dbCpu: { enabled: true, threshold: 80, window: "15m", severity: "warning" },
        dbConnections: { enabled: true, threshold: 80, window: "10m", severity: "warning" },
        dbFreeStorage: { enabled: true, threshold: 20, window: "15m", severity: "critical" },
        cacheMemory: { enabled: true, threshold: 80, window: "15m", severity: "warning" },
        cacheEvictions: { enabled: true, threshold: 0, window: "15m", severity: "warning" },
        budget: { enabled: true, forecastPercent: 80, actualPercent: 100 },
      },
      notify: { critical: ["oncall"], warning: [], info: [] },
    });
  });

  it("plans one uptime monitor per listed URL, defaults applied", () => {
    const plan = observabilityPlan(
      rootRunway({
        providers: { betterstack: {} },
        environments: { dev: {}, production: {} },
        observability: {
          uptime: [
            { name: "registry", url: "https://npm.acme.example/-/ping" },
            {
              name: "cache",
              url: "https://cache.acme.example/status",
              checkFrequencySeconds: 180,
              expectedStatusCodes: [401],
            },
          ],
        },
      }),
      { apps: {}, services: [] },
    );

    expect(plan.uptime).toEqual([
      {
        environment: "production",
        name: "registry",
        url: "https://npm.acme.example/-/ping",
        checkFrequencySeconds: 60,
        expectedStatusCodes: null,
      },
      {
        environment: "production",
        name: "cache",
        url: "https://cache.acme.example/status",
        checkFrequencySeconds: 180,
        expectedStatusCodes: [401],
      },
    ]);
  });

  it("refuses an uptime name listed twice, an unmonitored environment and a bad URL", () => {
    expect(
      issuesOf(() =>
        observabilityPlan(
          rootRunway({
            providers: { betterstack: {} },
            environments: { dev: {}, production: {} },
            observability: {
              uptime: [
                { name: "registry", url: "https://npm.acme.example/-/ping" },
                { name: "registry", url: "https://npm.acme.example/", environment: "dev" },
              ],
            },
          }),
          { apps: {}, services: [] },
        ),
      ).map((issue) => issue.path),
    ).toEqual(["root.observability.uptime.1.name", "root.observability.uptime.1.environment"]);

    // Runway's own parse refuses a non-https URL before the plan runs.
    expect(() =>
      rootRunway({
        providers: { betterstack: {} },
        environments: { production: {} },
        observability: { uptime: [{ name: "registry", url: "http://npm.acme.example/" }] },
      }),
    ).toThrow(/observability\.uptime\.0\.url/);
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
          { service: "commerce", kind: HeartbeatKind.Cron, name: "sweep", periodSeconds: 3600 },
        ],
      },
    );

    expect(plan.environments).toEqual(["production"]);
    expect(plan.telemetry).toEqual({ hotDays: 30, coldMonths: 0 });
    expect(plan.heartbeats.map((beat) => beat.name)).toEqual(["sweep"]);
    expect(plan.slos).toEqual({
      startAt: "first-paying-tenant",
      windowDays: 30,
      objectives: [],
      burnRateAlerts: [],
    });
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
    expect(
      issuesOf(() =>
        observabilityPlan(rootRunway({ environments: { staging: {} } }), {
          apps: {},
          services: ["commerce"],
          heartbeats: [
            { service: "commerce", kind: HeartbeatKind.Cron, name: "sweep", periodSeconds: 60 },
          ],
        }),
      ).map((issue) => issue.path),
    ).toEqual(["root.providers.betterstack"]);
  });

  it("refuses an organization given as a ref", () => {
    expect(
      issuesOf(() =>
        observabilityPlan(rootRunway({ providers: { sentry: { org: "ref:sentry.org" } } }), {
          apps: { web: appRunway("acme-web") },
          services: [],
        }),
      ),
    ).toEqual([
      {
        path: "root.providers.sentry.org",
        message: "Expected the organization slug (public, never a ref:)",
      },
    ]);
  });

  it("reports every failure at once", () => {
    expect(
      issuesOf(() =>
        observabilityPlan(rootRunway({ providers: { betterstack: {} } }), {
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
        }),
      )
        .map((issue) => issue.path)
        .sort(),
    ).toEqual([
      "apps.admin.telemetry.sentryProject",
      "apps.shop.telemetry.sentryProject",
      "heartbeats.0.service",
      "heartbeats.1.name",
      "heartbeats.2.periodSeconds",
      "heartbeats.3.name",
      "root.providers.sentry.org",
    ]);
  });
});

describe("observabilityPlan alerts and routes", () => {
  it("keeps a runway's own threshold and routes beside the defaults", () => {
    const plan = observabilityPlan(
      rootRunway({
        ...TEMPLATE_ROOT,
        observability: {
          alerts: { errorRate: { threshold: 5 }, cacheEvictions: { enabled: false } },
          notify: { critical: ["oncall", "slack:C07ABC1234"], warning: ["linear:STA"] },
        },
      }),
      { apps: {}, services: [] },
    );
    expect(plan.alerts.errorRate).toEqual({
      enabled: true,
      threshold: 5,
      window: "5m",
      severity: "critical",
    });
    expect(plan.alerts.cacheEvictions.enabled).toBe(false);
    expect(plan.notify).toEqual({
      critical: ["oncall", "slack:C07ABC1234"],
      warning: ["linear:STA"],
      info: [],
    });
  });
});

describe("observabilityPlan objectives", () => {
  it("derives the four SRE-workbook burn-rate alerts of each objective over 30 days", () => {
    const plan = observabilityPlan(
      rootRunway({
        providers: { betterstack: {} },
        observability: {
          slos: {
            objectives: [
              { service: "orders", availability: 99.9, latency: { thresholdMs: 250, percent: 99 } },
            ],
          },
        },
      }),
      { apps: {}, services: ["orders", "search"] },
    );

    expect(plan.slos.windowDays).toBe(30);
    expect(plan.slos.objectives).toEqual([
      {
        service: "orders",
        kind: SliKind.Availability,
        metric: "http.server.request.duration",
        target: 0.999,
        thresholdSeconds: null,
      },
      {
        service: "orders",
        kind: SliKind.Latency,
        metric: "http.server.request.duration",
        target: 0.99,
        thresholdSeconds: 0.25,
      },
    ]);
    const availability = plan.slos.burnRateAlerts.filter(
      (alert) => alert.kind === SliKind.Availability,
    );
    expect(availability).toEqual([
      {
        service: "orders",
        kind: SliKind.Availability,
        severity: "critical",
        burnRate: 14.4,
        threshold: 0.0144,
        budgetSpent: 0.02,
        longWindow: "1h",
        shortWindow: "5m",
      },
      {
        service: "orders",
        kind: SliKind.Availability,
        severity: "critical",
        burnRate: 6,
        threshold: 0.006,
        budgetSpent: 0.05,
        longWindow: "6h",
        shortWindow: "30m",
      },
      {
        service: "orders",
        kind: SliKind.Availability,
        severity: "warning",
        burnRate: 3,
        threshold: 0.003,
        budgetSpent: 0.1,
        longWindow: "1d",
        shortWindow: "2h",
      },
      {
        service: "orders",
        kind: SliKind.Availability,
        severity: "warning",
        burnRate: 1,
        threshold: 0.001,
        budgetSpent: 0.1,
        longWindow: "3d",
        shortWindow: "6h",
      },
    ]);
    expect(
      plan.slos.burnRateAlerts
        .filter((alert) => alert.kind === SliKind.Latency)
        .map((alert) => alert.threshold),
    ).toEqual([0.144, 0.06, 0.03, 0.01]);
  });

  it("scales the burn rates to the runway's window", () => {
    const plan = observabilityPlan(
      rootRunway({
        providers: { betterstack: {} },
        observability: {
          slos: { windowDays: 28, objectives: [{ service: "orders", availability: 99 }] },
        },
      }),
      { apps: {}, services: ["orders"] },
    );

    expect(plan.slos.windowDays).toBe(28);
    expect(plan.slos.burnRateAlerts.map((alert) => alert.burnRate)).toEqual([
      13.44, 5.6, 2.8, 0.933333333333,
    ]);
    expect(plan.slos.burnRateAlerts.map((alert) => alert.threshold)).toEqual([
      0.1344, 0.056, 0.028, 0.00933333333333,
    ]);
  });

  it("declares no objective or alert before the runway names one", () => {
    const plan = observabilityPlan(rootRunway(), { apps: {}, services: ["orders"] });

    expect(plan.slos).toEqual({
      startAt: "first-paying-tenant",
      windowDays: 30,
      objectives: [],
      burnRateAlerts: [],
    });
  });

  it("refuses an objective of an unknown service, one listed twice and a threshold off the buckets", () => {
    const issues = issuesOf(() =>
      observabilityPlan(
        rootRunway({
          providers: { betterstack: {} },
          observability: {
            slos: {
              objectives: [
                { service: "ledger", availability: 99.9 },
                { service: "orders", latency: { thresholdMs: 300, percent: 99 } },
                { service: "orders", availability: 99.5 },
              ],
            },
          },
        }),
        { apps: {}, services: ["orders"] },
      ),
    );

    expect(issues).toEqual([
      {
        path: "root.observability.slos.objectives.0.service",
        message: "ledger is not a service member",
      },
      {
        path: "root.observability.slos.objectives.1.latency.thresholdMs",
        message:
          "Expected a bucket bound of the duration histogram: 5, 10, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000",
      },
      { path: "root.observability.slos.objectives.2.service", message: "orders is listed twice" },
    ]);
  });
});
