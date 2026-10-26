/**
 * Stackra file contract:
 * Purpose: `INFRA_RUNWAY_SCHEMA`, the parts of an already parsed root runway that the GCP foundation and runtime
 *          read, checked strictly: the project, `providers.gcp` (default region, projects, required labels, billing
 *          account, budgets and the non-production spend stop), the GitHub repository, the regions, and per
 *          environment its `cloud`, regions, dedicated deployments, database server and backups, network, bucket
 *          defaults and file disks. Every other key passes through untouched.
 * Boundary: internal; `parseInfraRunway` is its only reader. `@stackra/runway` owns the root schema, whose provider
 *           blocks stay open (`providers` has a catch-all), so `providers.gcp` reaches here unchecked; this schema
 *           narrows only what infra-gcp reads. Which project an environment runs in is its runway `cloud` (ADR 0400),
 *           which replaced `providers.gcp.environments`. A project number must be a quoted string: YAML would read an
 *           unquoted one as a number.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decisions 1, 3 and 4), ADR 0171 (`ref:` values from the stacks repository), ADR 0172
 *                     (decision 5: budgets, tags and the non-production stop, applied per project), ADR 0186
 *                     (backups), ADR 0296 (root runway), ADR 0401 (spend stop, Cloud SQL recovery, deploy roles).
 */
import { z } from "zod";

/** A `ref:<path>` value, resolved from the stack config at infra time. */
const REF = "ref:[A-Za-z0-9_.-]+";

/** A GCP project id (6 to 30 characters, lower case), or `ref:<path>`. */
const PROJECT_ID = z
  .string()
  .regex(
    new RegExp(`^([a-z][a-z0-9-]{4,28}[a-z0-9]|${REF})$`),
    "Expected a GCP project id or ref:<path>",
  );

/** A GCP project number, quoted, or `ref:<path>`. */
const PROJECT_NUMBER = z
  .string()
  .regex(new RegExp(`^(\\d{1,20}|${REF})$`), "Expected a quoted project number or ref:<path>");

/** A billing account id (`XXXXXX-XXXXXX-XXXXXX`), or `ref:<path>`. */
const BILLING_ACCOUNT = z
  .string()
  .regex(
    new RegExp(`^([A-F0-9]{6}-[A-F0-9]{6}-[A-F0-9]{6}|${REF})$`),
    "Expected a billing account id or ref:<path>",
  );

/** A GitHub organisation or repository name; never a wildcard, since it ends up in a Workload Identity condition. */
const GITHUB_NAME = z.string().regex(/^[A-Za-z0-9_.-]+$/, "Expected a GitHub name");

/** A label key GCP accepts. */
const LABEL_KEY = z
  .string()
  .regex(/^[a-z][a-z0-9_-]{0,62}$/, "Expected a lower-case GCP label key");

/** A budget percentage. */
const PERCENT = z.int().min(1).max(1000);

/** A monthly amount in the billing account's currency, or `ref:<path>`. */
const AMOUNT = z.union([
  z.number().positive(),
  z.string().regex(new RegExp(`^(\\d+(\\.\\d+)?|${REF})$`), "Expected an amount or ref:<path>"),
]);

/** The `cloud` of an environment or dedicated deployment, as `@stackra/runway` has already checked it. */
const CLOUD = z.looseObject({ name: z.string(), account: z.string() });

/** A Cloud SQL backup policy: daily backups kept `retentionDays`, and point-in-time recovery for `pitrDays`. */
const BACKUPS = z.looseObject({
  retentionDays: z.int().min(1).max(365).optional(),
  pitr: z.boolean().optional(),
  pitrDays: z.int().min(1).max(35).optional(),
});

/** A config section that selects a disk (`filesystem.disk`, `media.disk`). */
const DISK = z.looseObject({ disk: z.string().optional() }).optional();

/** One environment, as far as the GCP foundation reads it. */
const ENVIRONMENT = z.looseObject({
  cloud: CLOUD.optional(),
  regions: z.array(z.string()).optional(),
  dedicated: z
    .record(
      z.string(),
      z.looseObject({ tenant: z.string(), cloud: CLOUD, regions: z.array(z.string()).optional() }),
    )
    .default({}),
  shared: z
    .looseObject({
      database: z
        .looseObject({
          tier: z.string().min(1).optional(),
          highAvailability: z.boolean().optional(),
          version: z
            .string()
            .regex(/^POSTGRES_\d+$/, "Expected a Cloud SQL Postgres version such as POSTGRES_17")
            .optional(),
          backups: BACKUPS.optional(),
        })
        .optional(),
      network: z.looseObject({ vpc: z.string().min(1).optional() }).optional(),
      buckets: z
        .looseObject({
          versioning: z.boolean().optional(),
          lifecycle: z.looseObject({ expireNoncurrentDays: z.int().min(1).optional() }).optional(),
        })
        .optional(),
    })
    .optional(),
  defaults: z
    .looseObject({
      service: z
        .looseObject({
          config: z.looseObject({ filesystem: DISK, media: DISK }).optional(),
        })
        .optional(),
    })
    .optional(),
});

/** The root runway, narrowed to what the GCP foundation reads. */
export const INFRA_RUNWAY_SCHEMA = z.looseObject({
  project: z.string(),
  providers: z.looseObject({
    gcp: z.looseObject({
      region: z
        .string()
        .regex(/^[a-z]+(-[a-z]+)+\d+$/, "Expected a GCP region such as europe-west3")
        .optional(),
      projects: z
        .record(z.string(), z.looseObject({ id: PROJECT_ID, number: PROJECT_NUMBER }))
        .default({}),
      requiredLabels: z.array(LABEL_KEY).default([]),
      billingAccount: BILLING_ACCOUNT.optional(),
      budgets: z
        .looseObject({
          currency: z.string().regex(/^[A-Z]{3}$/, "Expected the billing account's ISO 4217 code"),
          thresholds: z.array(PERCENT).min(1).max(5),
          stopNonProdAt: PERCENT.optional(),
          monthly: z.record(z.string(), AMOUNT).default({}),
        })
        .optional(),
    }),
    github: z.looseObject({ org: GITHUB_NAME.optional(), repo: GITHUB_NAME.optional() }).optional(),
  }),
  regions: z
    .record(z.string(), z.looseObject({ cloud: z.string(), location: z.string() }))
    .default({}),
  environments: z.record(z.string(), ENVIRONMENT).default({}),
});
