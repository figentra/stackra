/**
 * Stackra file contract:
 * Purpose: `AwsBaselineConfig`, the typed config of one environment's AWS foundation, derived from the root runway by
 *          `awsBaselineConfig` and read by the `awsBaseline` Pulumi program: the account and whether this environment
 *          owns its account-wide resources, the cost tags, the budgets, the database backups, the files bucket, the
 *          static egress addresses, the jurisdiction, the GitHub repository the deploy role trusts and the Encore Cloud
 *          account link.
 * Boundary: type only; plain JSON, so gen can write it as `<env>.infra.config.json`. Account ids, amounts and the
 *           Encore link may still be `ref:<path>`; no value is a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0171, ADR 0172, ADR 0186, ADR 0289 (decision 5: Encore Cloud), ADR 0296, ADR 0402.
 */
import type { RunwayEnvironment } from "@stackra/runway";

/** One environment's AWS foundation. */
export type AwsBaselineConfig = {
  /** The runway `project`. */
  readonly project: string;
  /** The environment this config is for. */
  readonly environment: RunwayEnvironment;
  /** `providers.aws.region`. */
  readonly region: string;
  /** The environment's account: a quoted 12-digit id or `ref:<path>`. */
  readonly account: string;
  /**
   * Whether this environment creates its account's account-wide resources (the GitHub OIDC provider, the Encore
   * Cloud role and the budgets): true for the first environment, in promotion order, that names the account.
   */
  readonly ownsAccount: boolean;
  /** Whether another environment runs in the same account, so backups select the database by its `env` tag. */
  readonly sharesAccount: boolean;
  /** The backup account (`providers.aws.accounts.backup`), or `null`. */
  readonly backupAccount: string | null;
  /** The provider's default tags: the project, the environment and every required tag key. */
  readonly tags: Readonly<Record<string, string>>;
  /** The account's monthly budget, or `null` when the runway has no `providers.aws.budgets`. */
  readonly budgets: {
    /** The limit in US dollars, or `ref:<path>`. */
    readonly monthlyUsd: string;
    /** Alert percentages of the limit. */
    readonly thresholds: readonly number[];
    /** The percentage at which non-production spend stops; `null` in an account production runs in. */
    readonly stopAt: number | null;
  } | null;
  /** The Postgres backups, or `null` when the environment declares none. */
  readonly database: {
    /** Days of point-in-time recovery, or `null` when `pitr` is off. */
    readonly pitrDays: number | null;
    /** Days a daily snapshot copy lives in the backup account. */
    readonly snapshotDays: number;
  } | null;
  /** The files bucket, or `null` when no service default puts files or media on the `s3` disk. */
  readonly files: {
    /** Object versioning; replication to the backup account needs it. */
    readonly versioning: boolean;
    /** Days a replaced object version is kept, or `null` for no limit. */
    readonly expireNoncurrentDays: number | null;
    /** The app origins a browser uploads from (the media CORS rule). */
    readonly origins: readonly string[];
  } | null;
  /** The static egress addresses partners allow-list, or `null` when the runway asks for none. */
  readonly egress: {
    /** How many Elastic IPs to hold. */
    readonly staticIps: number;
  } | null;
  /** The jurisdiction the region's data (backups included) stays in, from the runway `regions`, or `null`. */
  readonly jurisdiction: string | null;
  /** The repository whose deploy job may assume the environment's infra role, or `null`. */
  readonly github: { readonly org: string; readonly repo: string } | null;
  /** The Encore Cloud account link, or `null` when the services destination is not `encore-cloud`. */
  readonly encore: { readonly accountId: string; readonly externalId: string } | null;
};
