/**
 * Stackra file contract:
 * Purpose: `encoreAccess(name, args, opts)`, the role Encore Cloud assumes to provision and run the generated Encore
 *          app in the owner's account: trusted by Encore's AWS account with the external id of the Encore Cloud
 *          connection, holding AdministratorAccess as Encore's default connection asks.
 * Boundary: internal; one per account, created by the account's first environment. The owner pastes the role ARN
 *           into Encore Cloud's AWS connection; nothing here calls Encore. Encore's account id and the external id are
 *           stack config values, not secrets.
 * Runtime: node
 * Governing contract: ADR 0289 (decision 5: one Encore app), ADR 0170 (Encore Cloud deploys), ADR 0172 (decision 1).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";

import { ADMINISTRATOR_ACCESS } from "#node/constants/administrator-access.constant";
import { policyOf } from "#node/functions/policy-of.function";

/** The Encore Cloud role. */
export function encoreAccess(
  name: string,
  args: { encore: { accountId: string; externalId: string }; roleName: string },
  opts: pulumi.CustomResourceOptions,
): aws.iam.Role {
  const role = new aws.iam.Role(
    `${name}-encore`,
    {
      name: args.roleName,
      assumeRolePolicy: policyOf([
        {
          Effect: "Allow",
          Principal: { AWS: `arn:aws:iam::${args.encore.accountId}:root` },
          Action: "sts:AssumeRole",
          Condition: { StringEquals: { "sts:ExternalId": args.encore.externalId } },
        },
      ]),
    },
    opts,
  );
  // shortcut: Encore's default connection is account-wide admin, swap in Encore's narrow policy once STA-136 settles the deploy path.
  new aws.iam.RolePolicyAttachment(
    `${name}-encore-admin`,
    { role: role.name, policyArn: ADMINISTRATOR_ACCESS },
    opts,
  );
  return role;
}
