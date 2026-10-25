/**
 * Stackra file contract:
 * Purpose: `INFRA_RUNWAY_SCHEMA`, the parts of an already parsed root runway that the GCP foundation reads, checked
 *          strictly: the project, `providers.gcp` (region, projects, which environment runs in which project, required
 *          labels, billing account, budgets), the GitHub repository, and per environment its bucket defaults and file
 *          disks. Every other key passes through untouched.
 * Boundary: internal; `parseInfraRunway` is its only reader. `@stackra/runway` owns the root schema, whose provider
 *           blocks stay open (`providers` has a catch-all), so `providers.gcp` reaches here unchecked; this schema
 *           narrows only what infra-gcp reads. The environment-to-project map lives in `providers.gcp.environments`
 *           because the root environment block is strict and ADR 0354 decision 4 leaves the field names to the Runway
 *           schema. A project number must be a quoted string: YAML would read an unquoted one as a number.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decisions 1, 3 and 4), ADR 0171 (`ref:` values from the stacks repository), ADR 0172
 *                     (decision 5: budgets and tags, applied per project), ADR 0296 (root runway).
 */
import { Enum } from "@stackra/contracts";
import { RunwayEnvironment } from "@stackra/runway";
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

/** A runway environment name. */
const ENVIRONMENT_NAME = z.enum(
  Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]],
);

/** A config section that selects a disk (`filesystem.disk`, `media.disk`). */
const DISK = z.looseObject({ disk: z.string().optional() }).optional();

/** One environment, as far as the GCP foundation reads it. */
const ENVIRONMENT = z.looseObject({
  shared: z
    .looseObject({
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
        .regex(/^[a-z]+(-[a-z]+)+\d+$/, "Expected a GCP region such as europe-west3"),
      projects: z
        .record(z.string(), z.looseObject({ id: PROJECT_ID, number: PROJECT_NUMBER }))
        .default({}),
      environments: z.partialRecord(ENVIRONMENT_NAME, z.string()).default({}),
      requiredLabels: z.array(LABEL_KEY).default([]),
      billingAccount: BILLING_ACCOUNT.optional(),
      budgets: z
        .looseObject({
          currency: z.string().regex(/^[A-Z]{3}$/, "Expected the billing account's ISO 4217 code"),
          thresholds: z.array(PERCENT).min(1).max(5),
          monthly: z.record(z.string(), AMOUNT).default({}),
        })
        .optional(),
    }),
    github: z.looseObject({ org: GITHUB_NAME.optional(), repo: GITHUB_NAME.optional() }).optional(),
  }),
  environments: z.record(z.string(), ENVIRONMENT).default({}),
});
