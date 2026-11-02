/**
 * Stackra file contract:
 * Purpose: `OBSERVABILITY_SECTION_SCHEMA`, the root runway's `observability` block as a closed object, so a misspelt
 *          key fails `parseRunway` instead of passing silently.
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
});
