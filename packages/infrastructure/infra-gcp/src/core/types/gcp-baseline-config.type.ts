/**
 * Stackra file contract:
 * Purpose: `GcpBaselineConfig`, the typed config of one environment's GCP foundation, derived from the root runway by
 *          `gcpBaselineConfig` and read by the `gcpBaseline` Pulumi program: the GCP project and whether this
 *          environment owns its project-wide resources, the cost labels, the budget, the files bucket and the GitHub
 *          repository the deploy service account trusts.
 * Boundary: type only; plain JSON, so gen can write it as `<env>.infra-gcp.config.json`. Project ids and numbers, the
 *           billing account and amounts may still be `ref:<path>`; no value is a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decisions 3 and 4), ADR 0171, ADR 0172 (decision 5), ADR 0296.
 */
import type { RunwayEnvironment } from "@stackra/runway";

/** One environment's GCP foundation. */
export type GcpBaselineConfig = {
  /** The runway `project`. */
  readonly project: string;
  /** The environment this config is for. */
  readonly environment: RunwayEnvironment;
  /** `providers.gcp.region`. */
  readonly region: string;
  /** The environment's GCP project: its id and number, each a quoted value or `ref:<path>`. */
  readonly cloudProject: { readonly id: string; readonly number: string };
  /**
   * Whether this environment creates its project's project-wide resources (the budget and its topic): true for the
   * first environment, in promotion order, that names the project.
   */
  readonly ownsProject: boolean;
  /** The provider's default labels: the project, the environment and every required label key. */
  readonly labels: Readonly<Record<string, string>>;
  /** The project's monthly budget, or `null` when the runway has no `providers.gcp.budgets`. */
  readonly budgets: {
    /** The billing account the budget is created on, or `ref:<path>`. */
    readonly billingAccount: string;
    /** The billing account's currency (ISO 4217), as the runway states it. */
    readonly currency: string;
    /** The limit in that currency, or `ref:<path>`. */
    readonly amount: string;
    /** Alert percentages of the limit. */
    readonly thresholds: readonly number[];
  } | null;
  /** The files bucket, or `null` when no service default puts files or media on the `s3` disk. */
  readonly files: {
    /** Object versioning. */
    readonly versioning: boolean;
    /** Days a replaced object version is kept, or `null` for no limit. */
    readonly expireNoncurrentDays: number | null;
    /** The app origins a browser uploads from (the media CORS rule). */
    readonly origins: readonly string[];
  } | null;
  /** The repository whose deploy job may impersonate the environment's infra service account, or `null`. */
  readonly github: { readonly org: string; readonly repo: string } | null;
};
