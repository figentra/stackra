/**
 * Stackra file contract:
 * Purpose: `INFRA_RUNWAY_SCHEMA`, the parts of an already parsed root runway that the AWS foundation reads, checked
 *          strictly: the project, `providers.aws` (region, accounts, required tags, budgets, the backup vault lock),
 *          the GitHub repository,
 *          the Encore Cloud account link, the regions, and per environment its regions, services destination, Encore
 *          account, database backups, static egress addresses, bucket defaults and the file disk (`filesystem.disk`; media stores through it since ADR 0465). Every other key passes through untouched.
 * Boundary: internal; `parseInfraRunway` is its only reader. `@stackra/runway` owns the root schema, whose provider
 *           blocks stay open; this schema narrows only what infra-aws reads, so a misspelt budget or account fails
 *           here before any Pulumi program runs. An account id must be a quoted string: YAML would read an unquoted
 *           one as a number and drop its leading zeros.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (`ref:` values from the stacks repository), ADR 0172 (accounts, region, budgets, tags),
 *                     ADR 0186 (backups), ADR 0296 (root runway), ADR 0353 (residency), ADR 0402 (egress, jurisdiction),
 *                     ADR 0188 (decision 3: backups kept 35 days or less, or crypto-shredded).
 */
import { z } from "zod";

import { BACKUP_DAYS_CEILING } from "#core/constants/backup-days-ceiling.constant";

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

/**
 * The Postgres backups: snapshot copies kept `retentionDays`, and point-in-time recovery when `pitr`. Past 35 days the
 * runway must state `cryptoShredded: true` (erasure destroys the scope's data key, so old copies are unreadable);
 * otherwise a backup would outlive an erasure.
 */
const BACKUPS = z
  .looseObject({
    retentionDays: z.int().min(1).optional(),
    pitr: z.boolean().optional(),
    cryptoShredded: z.boolean().optional(),
  })
  .refine(
    (backups) =>
      (backups.retentionDays ?? 0) <= BACKUP_DAYS_CEILING || backups.cryptoShredded === true,
    {
      path: ["retentionDays"],
      message: `Keep backups ${BACKUP_DAYS_CEILING} days or less, or state cryptoShredded: true (ADR 0188 decision 3)`,
    },
  );

/**
 * The backup account vault's lock: retention bounds (defaulted from the environments' backups by `backupLockFrom`),
 * governance mode unless both `compliance: true` and `changeableForDays` are set. Compliance mode is permanent once
 * `changeableForDays` have passed: not even the root user can remove the lock or shorten a recovery point.
 */
const BACKUP_LOCK = z
  .looseObject({
    minRetentionDays: z.int().min(1).optional(),
    maxRetentionDays: z.int().min(1).optional(),
    compliance: z.boolean().optional(),
    changeableForDays: z.int().min(3).optional(),
  })
  .refine((lock) => (lock.compliance === true) === (lock.changeableForDays !== undefined), {
    path: ["changeableForDays"],
    message:
      "Compliance mode needs both compliance: true and changeableForDays (3 or more); after those days the lock can never be removed",
  });

/** A config section that selects a disk (`filesystem.disk`; a `media.disk` passes through unread, ADR 0465). */
const DISK = z.looseObject({ disk: z.string().optional() }).optional();

/** One environment, as far as the AWS foundation reads it. */
const ENVIRONMENT = z.looseObject({
  regions: z.array(z.string()).optional(),
  destinations: z.looseObject({ services: z.string().optional() }).optional(),
  encore: z.looseObject({ account: z.string().optional() }).optional(),
  shared: z
    .looseObject({
      database: z
        .looseObject({
          backups: BACKUPS.optional(),
        })
        .optional(),
      network: z
        .looseObject({
          egress: z
            .looseObject({
              staticIps: z
                .int()
                .min(1)
                .max(10, "Partners allow-list each address: keep to ten or fewer"),
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
          config: z.looseObject({ filesystem: DISK }).optional(),
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
      backupLock: BACKUP_LOCK.optional(),
    }),
    github: z.looseObject({ org: GITHUB_NAME.optional(), repo: GITHUB_NAME.optional() }).optional(),
    encore: z
      .looseObject({
        awsAccountId: ACCOUNT.optional(),
        externalId: z.string().min(1).optional(),
      })
      .optional(),
  }),
  regions: z
    .record(
      z.string(),
      z.looseObject({
        cloud: z.string(),
        location: z.string(),
        jurisdiction: z.string().optional(),
      }),
    )
    .default({}),
  environments: z.record(z.string(), ENVIRONMENT).default({}),
});
