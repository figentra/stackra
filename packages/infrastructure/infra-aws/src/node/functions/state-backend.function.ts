/**
 * Stackra file contract:
 * Purpose: `stateBackend(accounts, opts?)`, the Pulumi program of the state backend in the shared tooling account: a
 *          KMS key and a private, versioned bucket on it whose policy refuses plain HTTP and any other server-side
 *          encryption, and lets each environment's infra role read and write the state.
 * Boundary: run once by the owner in the core stack, before any environment stack can keep its state there; its
 *           outputs become the root runway's `providers.aws.state` refs. The environment roles are trusted by their
 *           fixed ARNs through a condition, so this stack may run before they exist.
 * Runtime: node
 * Governing contract: ADR 0171 (decision 4 and its enforcement: state encryption is a bucket policy, as amended by
 *                     0289 decision 9: the tooling account), ADR 0172.
 */
import * as pulumi from "@pulumi/pulumi";

import { costTags } from "#core/functions/cost-tags.function";
import type { AwsAccounts } from "#core/types/aws-accounts.type";
import { accountId } from "#node/functions/account-id.function";
import { accountProvider } from "#node/functions/account-provider.function";
import { crossAccount } from "#node/functions/cross-account.function";
import { dataKey } from "#node/functions/data-key.function";
import { environmentUsers } from "#node/functions/environment-users.function";
import { privateBucket } from "#node/functions/private-bucket.function";
import type { StateBackendOutputs } from "#node/types/state-backend-outputs.type";

/**
 * The state backend.
 *
 * @param accounts - from `awsAccounts(root)`.
 * @throws TypeError when the runway names no shared account, or an account is not 12 digits.
 * @example
 * export const state = stateBackend(awsAccounts(readRunway("runway.yaml", "root")));
 */
export function stateBackend(
  accounts: AwsAccounts,
  opts?: pulumi.ComponentResourceOptions,
): StateBackendOutputs {
  if (accounts.shared === null)
    throw new TypeError(
      "providers.aws.accounts.shared names no account: the Pulumi state lives in the shared tooling account",
    );
  const { project, region } = accounts;
  const account = accountId(accounts.shared, "providers.aws.accounts.shared");
  const users = environmentUsers(accounts, "infra");
  const name = `${project}-state`;

  const group = new pulumi.ComponentResource("stackra:infra-aws:StateBackend", name, {}, opts);
  const provider = accountProvider(
    name,
    { account, region, tags: costTags(project, "shared", accounts.requiredTags) },
    { parent: group },
  );
  const options = { parent: group, provider };

  const key = dataKey(
    name,
    { account, alias: name, description: `${project}: the Pulumi state`, users },
    options,
  );
  const { bucket } = privateBucket(
    name,
    {
      keyArn: key.arn,
      versioning: true,
      lifecycle: [],
      statements: (arn) => [
        {
          Sid: "DenyOtherEncryption",
          Effect: "Deny",
          Principal: "*",
          Action: "s3:PutObject",
          Resource: pulumi.interpolate`${arn}/*`,
          Condition: {
            StringNotEquals: { "s3:x-amz-server-side-encryption": "aws:kms" },
            Null: { "s3:x-amz-server-side-encryption": "false" },
          },
        },
        ...users.flatMap((user, index) => [
          {
            Sid: `List${index}`,
            Effect: "Allow",
            Action: "s3:ListBucket",
            Resource: arn,
            ...crossAccount(user),
          },
          {
            Sid: `ReadWrite${index}`,
            Effect: "Allow",
            Action: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
            Resource: pulumi.interpolate`${arn}/*`,
            ...crossAccount(user),
          },
        ]),
      ],
    },
    options,
  );
  return { bucket: bucket.bucket, kmsKeyArn: key.arn };
}
