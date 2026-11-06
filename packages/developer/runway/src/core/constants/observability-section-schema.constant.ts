/**
 * Stackra file contract:
 * Purpose: `OBSERVABILITY_SECTION_SCHEMA`, the root runway's `observability` block as a closed object, so a misspelt
 *          key fails `parseRunway` instead of passing silently. Beside logs, heartbeats, objectives, the status page
 *          and uptime, it holds the alerts figentra/infra sets in a product's account (`alerts`) and where each
 *          severity goes (`notify`).
 * Boundary: internal; validation only, with no defaults. infra-observability stays authoritative and parses the block
 *           with its own `OBSERVABILITY_SCHEMA` and defaults. It depends on @stackra/runway, so this mirrors its keys
 *           and value rules rather than import them; a key added there is added here in the same change.
 * Runtime: isomorphic
 * Governing contract: ADR 0296; ADR 0184; the Runway inventory of 2026-11-02 (static/ finding 1); STA-1976.
 */
import { z } from "zod";

import { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** An https URL. */
const HTTPS_URL = z.string().regex(/^https:\/\/\S+$/, "Expected an https:// URL");

/** A runway environment name. */
const ENVIRONMENT = z.enum(
  Object.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]],
);

/** How bad a firing alert is. */
const SEVERITY = z.enum(["critical", "warning", "info"]);

/** One metric alert; its direction (above or below the threshold) is fixed per alert. */
const ALERT = z
  .strictObject({
    enabled: z.boolean().optional(),
    threshold: z.number().min(0).optional(),
    window: z
      .string()
      .regex(/^[0-9]+m$/, "Expected minutes such as 5m")
      .optional(),
    severity: SEVERITY.optional(),
  })
  .optional();

/** One notification route: Better Stack on-call, an email, a Slack channel id or a Linear team key. */
const ROUTE = z
  .string()
  .regex(
    /^(?:oncall|email:[^\s@]+@[^\s@]+\.[^\s@]+|slack:[A-Z0-9]{9,12}|linear:[A-Z][A-Z0-9]{1,9})$/,
    "Expected oncall, email:<address>, slack:<channel id> or linear:<team key>",
  );

/** Observability, as infra-observability's `OBSERVABILITY_SCHEMA` reads it (ADR 0184). */
export const OBSERVABILITY_SECTION_SCHEMA = z.strictObject({
  logs: z
    .strictObject({
      hotDays: z.int().min(1).optional(),
      coldMonths: z.int().min(0).optional(),
      coldStore: z.enum(["s3"]).optional(),
    })
    .optional(),
  heartbeats: z
    .strictObject({
      crons: z.boolean().optional(),
      relays: z.boolean().optional(),
      workers: z.boolean().optional(),
    })
    .optional(),
  slos: z.strictObject({ startAt: z.enum(["first-paying-tenant"]).optional() }).optional(),
  statusPage: z
    .strictObject({
      subdomain: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, "Expected a DNS label"),
      companyName: z.string().min(1),
      companyUrl: HTTPS_URL,
      timezone: z.string().min(1),
      customDomain: z.string().min(1).optional(),
      published: z.boolean(),
      environments: z.array(ENVIRONMENT).min(1),
    })
    .optional(),
  uptime: z
    .array(
      z.strictObject({
        name: z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, "Expected a kebab-case name"),
        url: HTTPS_URL,
        environment: ENVIRONMENT.optional(),
        checkFrequencySeconds: z.int().min(30).optional(),
        expectedStatusCodes: z.array(z.int().min(100).max(599)).min(1).optional(),
      }),
    )
    .optional(),
  alerts: z
    .strictObject({
      environments: z.array(ENVIRONMENT).min(1).optional(),
      errorRate: ALERT,
      latencyP95: ALERT,
      dbCpu: ALERT,
      dbConnections: ALERT,
      dbFreeStorage: ALERT,
      cacheMemory: ALERT,
      cacheEvictions: ALERT,
      budget: z
        .strictObject({
          enabled: z.boolean().optional(),
          forecastPercent: z.int().min(1).optional(),
          actualPercent: z.int().min(1).optional(),
        })
        .optional(),
    })
    .optional(),
  notify: z
    .strictObject({
      critical: z.array(ROUTE).optional(),
      warning: z.array(ROUTE).optional(),
      info: z.array(ROUTE).optional(),
    })
    .optional(),
});
