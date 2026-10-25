/**
 * Stackra file contract:
 * Purpose: `EnvironmentAccount`, one environment and the AWS account it runs in: the account's key in
 *          `providers.aws.accounts` and its id or `ref:<path>`.
 * Boundary: type only; data from the root runway, resolved by the Pulumi programs (`resolveRef`).
 * Runtime: isomorphic
 * Governing contract: ADR 0172 (decision 1: accounts), ADR 0171 (`ref:` values).
 */
import type { RunwayEnvironment } from "@stackra/runway";

/** An environment and its account. */
export type EnvironmentAccount = {
  /** The runway environment. */
  readonly environment: RunwayEnvironment;
  /** The account's key in `providers.aws.accounts` (`nonprod`). */
  readonly name: string;
  /** A quoted 12-digit id or `ref:<path>`. */
  readonly account: string;
};
