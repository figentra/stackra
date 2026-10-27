/**
 * Stackra file contract:
 * Purpose: `GcpBaselineConfig`, the typed config of one deployment's GCP foundation, derived from the root runway by
 *          `gcpBaselineConfig` and read by the `gcpBaseline` Pulumi program: the deployment (project, region, stack
 *          prefix, ownership, labels), the budget with its non-production spend stop, the files bucket, the GitHub
 *          repository the deploy service account trusts, the Encore Cloud service account that runs its services and
 *          the static egress addresses partners allow-list.
 * Boundary: type only; plain JSON, so gen can write it as `<env>.infra-gcp.config.json`. Project ids and numbers, the
 *           billing account and amounts may still be `ref:<path>`; no value is a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decisions 3 and 4), ADR 0171, ADR 0172 (decision 5), ADR 0296, ADR 0400, ADR 0401, ADR 0435, ADR 0402.
 */
import type { GcpDeployment } from "#core/types/gcp-deployment.type";

/** One deployment's GCP foundation. */
export type GcpBaselineConfig = GcpDeployment & {
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
    /**
     * The percentage at which the project's billing is detached (`stopNonProdAt`); `null` in a project production
     * runs in, or when the runway sets none.
     */
    readonly stopAt: number | null;
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
  /** The repository whose deploy job may impersonate the deployment's infra service account, or `null`. */
  readonly github: { readonly org: string; readonly repo: string } | null;
  /**
   * The Encore Cloud service account granted `ENCORE_ROLES` on the project (an email or `ref:<path>`), or `null` when
   * the environment's services do not deploy to `encore-cloud` or the runway names no `providers.gcp.encore`.
   */
  readonly encore: { readonly serviceAccount: string } | null;
  /** The static egress addresses partners allow-list (`shared.network.egress`), or `null` when the runway asks for none. */
  readonly egress: {
    /** How many regional external addresses to reserve. */
    readonly staticIps: number;
  } | null;
};
