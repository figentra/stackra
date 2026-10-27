/**
 * Stackra file contract:
 * Purpose: `dataKey(name, args, opts)`, a customer-managed KMS key with yearly rotation and a 30-day deletion window,
 *          its alias, and a key policy that keeps the owning account in control and lets each listed cross-account
 *          user encrypt, decrypt and grant the key to AWS services (a snapshot copy, a replication, a state read).
 * Boundary: internal; one key per purpose (the environment's data, the Pulumi state, the backup account). A database
 *           copied to the backup account must be encrypted with its environment's data key, since an AWS-managed key
 *           cannot be shared across accounts.
 * Runtime: node
 * Governing contract: ADR 0171 (decision 4: state encrypted with KMS), ADR 0186 (decisions 2 and 3), ADR 0172.
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";

import { crossAccount } from "#node/functions/cross-account.function";
import type { KeyUser } from "#node/types/key-user.type";

/** What a cross-account user may do with the key. */
const USE = [
  "kms:Encrypt",
  "kms:Decrypt",
  "kms:ReEncrypt*",
  "kms:GenerateDataKey*",
  "kms:DescribeKey",
];

/** The grant actions a user needs so an AWS service can use the key on its behalf. */
const GRANT = ["kms:CreateGrant", "kms:ListGrants", "kms:RevokeGrant"];

/**
 * Declares a customer-managed KMS key with yearly rotation, its alias and a cross-account key policy.
 *
 * @param args.account - the 12-digit account that owns the key.
 * @param args.alias - the alias without the `alias/` prefix.
 * @param args.users - the cross-account users.
 */
export function dataKey(
  name: string,
  args: { account: string; alias: string; description: string; users: readonly KeyUser[] },
  opts: pulumi.CustomResourceOptions,
): aws.kms.Key {
  const statements: object[] = [
    {
      Sid: "OwnerAccount",
      Effect: "Allow",
      Principal: { AWS: `arn:aws:iam::${args.account}:root` },
      Action: "kms:*",
      Resource: "*",
    },
  ];
  args.users.forEach((user, index) => {
    statements.push(
      { Sid: `Use${index}`, Effect: "Allow", Action: USE, Resource: "*", ...crossAccount(user) },
      {
        Sid: `Grant${index}`,
        Effect: "Allow",
        Action: GRANT,
        Resource: "*",
        ...crossAccount(user, { Bool: { "kms:GrantIsForAWSResource": "true" } }),
      },
    );
  });
  const key = new aws.kms.Key(
    name,
    {
      description: args.description,
      enableKeyRotation: true,
      deletionWindowInDays: 30,
      policy: JSON.stringify({ Version: "2012-10-17", Statement: statements }),
    },
    opts,
  );
  new aws.kms.Alias(name, { name: `alias/${args.alias}`, targetKeyId: key.keyId }, opts);
  return key;
}
