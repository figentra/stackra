/**
 * Stackra file contract:
 * Purpose: `INFRA_RUNWAY_SCHEMA`, the parts of an already parsed root runway that the AWS foundation reads, checked
 *          strictly: the project, `providers.aws` (region, accounts, required tags, budgets), the GitHub repository,
 *          the Encore Cloud account link, and per environment its services destination, Encore account, database
 *          backups, bucket defaults and file disks. Every other key passes through untouched.
 * Boundary: internal; `parseInfraRunway` is its only reader. `@stackra/runway` owns the root schema, whose provider
 *           blocks stay open; this schema narrows only what infra-aws reads, so a misspelt budget or account fails
 *           here before any Pulumi program runs. An account id must be a quoted string: YAML would read an unquoted
 *           one as a number and drop its leading zeros.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (`ref:` values from the stacks repository), ADR 0172 (accounts, region, budgets, tags),
 *                     ADR 0186 (backups), ADR 0296 (root runway).
 */
import { z } from "zod";

/** An AWS account: a quoted 12-digit id, or `ref:<path>` resolved from the stack config at infra time. */
const ACCOUNT = z
  .string()
  .regex(/^(\d{12}|ref:[A-Za-z0-9_.-]+)$/, "Expected a quoted 12-digit account id or ref:<path>");

/** A GitHub organisation or repository name; never a wildcard, since it ends up in an OIDC trust condition. */
const GITHUB_NAME = z.string().regex(/^[A-Za-z0-9_.-]+$/, "Expected a GitHub name");

/** A budget percentage. */
const PERCENT = z.int().min(1).max(1000);

/** A monthly amount in US dollars, or `ref:<path>`. */
const AMOUNT = z.union([
  z.number().positive(),
  z.string().regex(/^(\d+(\.\d+)?|ref:[A-Za-z0-9_.-]+)$/, "Expected an amount or ref:<path>"),
]);

/** A config section that selects a disk (`filesystem.disk`, `media.disk`). */
const DISK = z.looseObject({ disk: z.string().optional() }).optional();

/** One environment, as far as the AWS foundation reads it. */
const ENVIRONMENT = z.looseObject({
  destinations: z.looseObject({ services: z.string().optional() }).optional(),
  encore: z.looseObject({ account: z.string().optional() }).optional(),
  shared: z
    .looseObject({
      database: z
        .looseObject({
          backups: z
            .looseObject({
              retentionDays: z.int().min(1).optional(),
              pitr: z.boolean().optional(),
            })
            .optional(),
        })
        .optional(),
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

/** The root runway, narrowed to what the AWS foundation reads. */
export const INFRA_RUNWAY_SCHEMA = z.looseObject({
  project: z
    .string()
    .max(32, "Keep the project name to 32 characters: it prefixes role and bucket names"),
  providers: z.looseObject({
    aws: z.looseObject({
      region: z
        .string()
        .regex(/^[a-z]{2}(-[a-z]+)+-\d$/, "Expected an AWS region such as me-central-1"),
      accounts: z.record(z.string(), ACCOUNT).default({}),
      requiredTags: z.array(z.string()).default([]),
      budgets: z
        .looseObject({
          thresholds: z.array(PERCENT).min(1).max(5),
          stopNonProdAt: PERCENT.optional(),
          monthlyUsd: z.record(z.string(), AMOUNT).default({}),
        })
        .optional(),
    }),
    github: z.looseObject({ org: GITHUB_NAME.optional(), repo: GITHUB_NAME.optional() }).optional(),
    encore: z
      .looseObject({
        awsAccountId: ACCOUNT.optional(),
        externalId: z.string().min(1).optional(),
      })
      .optional(),
  }),
  environments: z.record(z.string(), ENVIRONMENT).default({}),
});
