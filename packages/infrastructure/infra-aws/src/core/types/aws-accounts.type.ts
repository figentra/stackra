/**
 * Stackra file contract:
 * Purpose: `AwsAccounts`, the accounts of a root runway as the account-wide programs read them: the project, the one
 *          region, the shared (tooling) account that holds the Pulumi state, the backup account, the tags every
 *          resource carries and each environment that names an account, in promotion order.
 * Boundary: type only; ids stay `ref:<path>` until a Pulumi program resolves them.
 * Runtime: isomorphic
 * Governing contract: ADR 0172 (decisions 1, 2 and 5), ADR 0171 (decision 4 as amended by 0289 decision 9: state in
 *                     the tooling account), ADR 0186 (decision 2: the backup account).
 */
import type { EnvironmentAccount } from "#core/types/environment-account.type";

/** The accounts of one product. */
export type AwsAccounts = {
  /** The runway `project`; it prefixes every role, key alias and fixed bucket name. */
  readonly project: string;
  /** `providers.aws.region`. */
  readonly region: string;
  /** `providers.aws.accounts.shared`, the tooling account, or `null`. */
  readonly shared: string | null;
  /** `providers.aws.accounts.backup`, or `null`. */
  readonly backup: string | null;
  /** `providers.aws.requiredTags`, the tag keys every resource carries. */
  readonly requiredTags: readonly string[];
  /** Each environment that names an account, in promotion order. */
  readonly environments: readonly EnvironmentAccount[];
};
