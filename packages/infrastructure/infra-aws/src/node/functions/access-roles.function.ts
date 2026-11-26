/**
 * Stackra file contract:
 * Purpose: `accessRoles(name, args, opts)`, the sign-in roles of one account and their Account Access Manager
 *          entitlements: each role trusts only `account-access.amazonaws.com`, carries its managed and inline policies,
 *          and one entitlement grants it to the Identity Center principal through the organization's application.
 * Boundary: the roles are made through `opts` (the account's provider); the entitlements through `args.entitlements`
 *           (the management account's provider, in the application's region). Entitlements are immutable, so a changed
 *           role or principal replaces its entitlement. No IAM user or key exists.
 * Runtime: node
 * Governing contract: ADR 0172 (decision 1: people sign in through Identity Center, no IAM users), ADR 0524.
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";

import { policyOf } from "#node/functions/policy-of.function";
import type { AccessPrincipal } from "#node/types/access-principal.type";
import type { AccessRole } from "#node/types/access-role.type";

/**
 * What the account-access service may do with the role. AWS's docs add `sts:TagSession`; the roles made by hand on
 * 2026-11-05 trust only these two, and sign-in works with them.
 */
const TRUST_ACTIONS = ["sts:AssumeRole", "sts:SetContext"];

/** The roles, by role name. */
export function accessRoles(
  name: string,
  args: {
    applicationArn: string;
    principal: AccessPrincipal;
    roles: readonly AccessRole[];
    entitlements: pulumi.CustomResourceOptions;
  },
  opts: pulumi.CustomResourceOptions,
): Record<string, aws.iam.Role> {
  const roles: Record<string, aws.iam.Role> = {};
  for (const spec of args.roles) {
    const id = `${name}-${spec.name.toLowerCase()}`;
    const role = new aws.iam.Role(
      id,
      {
        name: spec.name,
        path: spec.path,
        maxSessionDuration: spec.maxSessionSeconds,
        assumeRolePolicy: policyOf([
          {
            Effect: "Allow",
            Principal: { Service: "account-access.amazonaws.com" },
            Action: TRUST_ACTIONS,
          },
        ]),
        ...(spec.tags !== undefined && { tags: { ...spec.tags } }),
      },
      opts,
    );
    spec.policyArns.forEach((policyArn, index) => {
      new aws.iam.RolePolicyAttachment(
        index === 0 ? id : `${id}-${index}`,
        { role: role.name, policyArn },
        opts,
      );
    });
    for (const [policyName, document] of Object.entries(spec.inline ?? {}))
      new aws.iam.RolePolicy(
        `${id}-${policyName}`,
        { name: policyName, role: role.name, policy: JSON.stringify(document) },
        opts,
      );
    new aws.accountaccess.Entitlement(
      id,
      {
        applicationArn: args.applicationArn,
        entitlement: {
          principalRole: {
            principal: { identityCenter: { ...args.principal } },
            roleArn: role.arn,
          },
        },
      },
      args.entitlements,
    );
    roles[spec.name] = role;
  }
  return roles;
}
