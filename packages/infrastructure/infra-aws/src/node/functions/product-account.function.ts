/**
 * Stackra file contract:
 * Purpose: `productAccount(name, args, opts)`, account vending: a member account in its unit, its opt-in region turned
 *          on, a provider into it through the role Organizations made there, its monthly budget with email alerts, the
 *          sign-in roles with their Account Access Manager entitlements, and optionally a read-only role that
 *          pull-request previews assume instead of the access role.
 * Boundary: runs in the management account (`opts` carries its provider, in the Account Access application's region).
 *           The account is protected: removing it from the list never closes it. Its workloads, infra roles and
 *           Encore role come later from `awsBaseline` and Runway, not from here.
 * Runtime: node
 * Governing contract: ADR 0172 (decisions 1, 2 and 5), ADR 0354 (decision 2: one account per product and region),
 *                     ADR 0524.
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { accessRoles } from "#node/functions/access-roles.function";
import { policyOf } from "#node/functions/policy-of.function";
import type { ProductAccountArgs } from "#node/types/product-account-args.type";

/** AWS's managed read-only policy, for the preview reader. */
const READ_ONLY_ACCESS = "arn:aws:iam::aws:policy/ReadOnlyAccess";

/** IAM and Budgets are global; the member provider talks to them through us-east-1. */
const GLOBAL_REGION = "us-east-1";

/**
 * The account.
 *
 * @example
 * productAccount("pay-me", { accountName: "acme-pay-me", email: "aws-pay-me@acme.example", parentId: units["Workloads/me"].id,
 *   optInRegion: "me-central-1", access: { applicationArn, principal: { userId }, roles } }, { provider: management });
 */
export function productAccount(
  name: string,
  args: ProductAccountArgs,
  opts: pulumi.CustomResourceOptions,
): {
  account: aws.organizations.Account;
  provider: aws.Provider;
  roles: Record<string, aws.iam.Role>;
} {
  const accessRoleName = args.accessRoleName ?? "OrganizationAccountAccessRole";
  const account = new aws.organizations.Account(
    name,
    {
      name: args.accountName,
      email: args.email,
      parentId: args.parentId,
      iamUserAccessToBilling: "DENY",
      roleName: accessRoleName,
      closeOnDeletion: false,
      ...(args.tags !== undefined && { tags: { ...args.tags } }),
    },
    // Neither is readable after creation, so an imported account would always show a diff.
    { ...opts, protect: true, ignoreChanges: ["iamUserAccessToBilling", "roleName"] },
  );
  const region =
    args.optInRegion === undefined
      ? undefined
      : new aws.account.Region(
          name,
          { accountId: account.id, regionName: args.optInRegion, enabled: true },
          opts,
        );

  const { reader } = args;
  if (args.readOnly === true && reader === undefined)
    throw new TypeError(`${name}: readOnly needs a reader role`);
  const through =
    args.readOnly === true && reader !== undefined
      ? `${reader.path}${reader.name}`
      : `/${accessRoleName}`;
  const provider = new aws.Provider(
    name,
    {
      region: GLOBAL_REGION,
      allowedAccountIds: [account.id],
      assumeRoles: [
        {
          roleArn: pulumi.interpolate`arn:aws:iam::${account.id}:role${through}`,
          sessionName: `vending-${name}`,
        },
      ],
    },
    { ...opts, provider: undefined },
  );
  const inAccount = {
    parent: opts.parent,
    provider,
    dependsOn: region === undefined ? [] : [region],
  };

  const { budget } = args;
  if (budget !== undefined)
    new aws.budgets.Budget(
      name,
      {
        name: budget.name,
        accountId: account.id,
        budgetType: "COST",
        limitAmount: budget.monthlyUsd,
        limitUnit: "USD",
        timeUnit: "MONTHLY",
        notifications: budget.alerts.map((alert) => ({
          comparisonOperator: "GREATER_THAN",
          threshold: alert.percent,
          thresholdType: "PERCENTAGE",
          notificationType: alert.kind,
          subscriberEmailAddresses: [...budget.emails],
        })),
      },
      inAccount,
    );

  if (reader !== undefined) {
    const role = new aws.iam.Role(
      `${name}-reader`,
      {
        name: reader.name,
        path: reader.path,
        assumeRolePolicy: policyOf([
          {
            Effect: "Allow",
            Principal: { AWS: [...reader.trustedArns] },
            Action: "sts:AssumeRole",
          },
        ]),
      },
      inAccount,
    );
    new aws.iam.RolePolicyAttachment(
      `${name}-reader`,
      { role: role.name, policyArn: READ_ONLY_ACCESS },
      inAccount,
    );
  }

  const roles = accessRoles(
    name,
    {
      applicationArn: args.access.applicationArn,
      principal: args.access.principal,
      roles: args.access.roles,
      entitlements: opts,
    },
    inAccount,
  );
  return { account, provider, roles };
}
