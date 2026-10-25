/**
 * Stackra file contract:
 * Purpose: `awsAccounts(root)`, the accounts of a root runway for the account-wide programs (`stateBackend`,
 *          `backupAccount`): the project, the region, the shared and backup accounts, the required tags and each
 *          environment's account.
 * Boundary: a parsed root runway in, plain data out; ids stay `ref:<path>` until a Pulumi program resolves them.
 * Runtime: isomorphic
 * Governing contract: ADR 0172 (decisions 1 and 2), ADR 0171 (decision 4 as amended by 0289 decision 9), ADR 0186.
 */
import type { RootRunway } from "@stackra/runway";

import { accountsFrom } from "#core/functions/accounts-from.function";
import { parseInfraRunway } from "#core/functions/parse-infra-runway.function";
import type { AwsAccounts } from "#core/types/aws-accounts.type";

/**
 * The accounts of `root`.
 *
 * @throws RunwayInvalidError when `providers.aws` is missing or invalid, or an environment names an unknown account.
 * @example
 * const accounts = awsAccounts(readRunway("runway.yaml", "root"));
 * accounts.environments; // [{ environment: "staging", name: "nonprod", account: "ref:aws.accounts.nonprod" }, …]
 */
export function awsAccounts(root: RootRunway): AwsAccounts {
  return accountsFrom(parseInfraRunway(root));
}
