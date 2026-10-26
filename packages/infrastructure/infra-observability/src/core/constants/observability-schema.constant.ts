/**
 * Stackra file contract:
 * Purpose: `OBSERVABILITY_SCHEMA`, the root runway's `observability` section, which `@stackra/runway` leaves open for
 *          its owner to check: log retention (`logs.hotDays` searchable, `logs.coldMonths` archived in `logs.coldStore`),
 *          the heartbeat switches (`heartbeats.crons`, `relays`, `workers`), when objectives start (`slos.startAt`)
 *          and the public status page (`statusPage`: its Better Stack subdomain, company, time zone, optional custom
 *          domain, whether it is published, and the environments whose heartbeats it shows). An omitted key takes the
 *          ADR 0184 value: 30 days hot, 13 months in S3, every heartbeat on, objectives from the first paying tenant,
 *          no status page.
 * Boundary: internal; `observabilityPlan` reads it. Strict at every level, so a misspelt key fails.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decisions 3 to 5), ADR 0185 (decision 3: the status page), ADR 0296 (decision 2:
 *                     root facts), ADR 0168 (decision 4: one schema-validated runway), ADR 0402.
 */
import { Enum } from "@stackra/contracts";
import { RunwayEnvironment } from "@stackra/runway";
import { z } from "zod";

/** The `observability` section of a root runway, defaults applied. */
export const OBSERVABILITY_SCHEMA = z.strictObject({
  logs: z
    .strictObject({
      hotDays: z.int().min(1).default(30),
      coldMonths: z.int().min(0).default(13),
      coldStore: z.enum(["s3"]).default("s3"),
    })
    .prefault({}),
  heartbeats: z
    .strictObject({
      crons: z.boolean().default(true),
      relays: z.boolean().default(true),
      workers: z.boolean().default(true),
    })
    .prefault({}),
  slos: z
    .strictObject({ startAt: z.enum(["first-paying-tenant"]).default("first-paying-tenant") })
    .prefault({}),
  statusPage: z
    .strictObject({
      subdomain: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, "Expected a DNS label"),
      companyName: z.string().min(1),
      companyUrl: z.string().regex(/^https:\/\/\S+$/, "Expected an https:// URL"),
      timezone: z.string().min(1),
      customDomain: z
        .string()
        .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/, "Expected a host name")
        .optional(),
      published: z.boolean(),
      environments: z
        .array(
          z.enum(Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]]),
        )
        .min(1),
    })
    .optional(),
});
