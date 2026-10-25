/**
 * Stackra file contract:
 * Purpose: `accountProvider(name, args, opts)`, an AWS provider pinned to one account and region that stamps the cost
 *          tags on every resource, for the account-wide stacks (the state backend and the backup account).
 * Boundary: internal; credentials come from the environment the program runs in (the owner's SSO session or a CI
 *           role); the provider only refuses every other account.
 * Runtime: node
 * Governing contract: ADR 0172 (decisions 1, 2 and 5).
 */
import * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";

/** The pinned provider. */
export function accountProvider(
  name: string,
  args: { account: string; region: string; tags: Readonly<Record<string, string>> },
  opts: pulumi.CustomResourceOptions,
): aws.Provider {
  return new aws.Provider(
    name,
    {
      region: args.region as aws.Region,
      allowedAccountIds: [args.account],
      defaultTags: { tags: { ...args.tags } },
    },
    opts,
  );
}
