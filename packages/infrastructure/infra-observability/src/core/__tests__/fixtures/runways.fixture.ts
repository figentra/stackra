/**
 * Stackra file contract:
 * Purpose: test fixtures: `rootRunway(document)` and `appRunway(sentryProject)`, runways checked by `@stackra/runway`'s
 *          own `parseRunway`, so every test input is a document the real schemas accept; `TEMPLATE_ROOT`, the sections
 *          of the template's root runway the telemetry plan reads.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decisions 1 and 2); ADR 0184.
 */
import { parseRunway, type AppRunway, type RootRunway } from "@stackra/runway";

/** The template's four environments, its Sentry and Better Stack providers and its observability section. */
export const TEMPLATE_ROOT = {
  project: "acme-platform",
  providers: {
    sentry: { org: "acme" },
    betterstack: { source: "ref:betterstack.source" },
    otlp: { endpoint: "ref:otlp.endpoint" },
  },
  environments: { dev: {}, preview: {}, staging: {}, production: {} },
  observability: {
    logs: { hotDays: 30, coldMonths: 13, coldStore: "s3" },
    heartbeats: { crons: true, relays: true, workers: true },
    slos: { startAt: "first-paying-tenant" },
  },
};

/** A parsed root runway with `document`'s sections over a bare project. */
export function rootRunway(document: Readonly<Record<string, unknown>> = {}): RootRunway {
  return parseRunway("root", {
    version: 3,
    project: "acme-platform",
    environments: {},
    ...document,
  });
}

/** A parsed app runway naming `sentryProject`, or no telemetry block without one. */
export function appRunway(sentryProject?: string): AppRunway {
  return parseRunway("app", {
    version: 3,
    environments: {},
    ...(sentryProject === undefined ? {} : { telemetry: { sentryProject } }),
  });
}
