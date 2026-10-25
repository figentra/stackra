/**
 * Stackra file contract:
 * Purpose: `ciAccess(name, args, opts)`, the environment's infra role that a GitHub Actions job assumes over OIDC to
 *          apply the environment's Pulumi program, plus the account's GitHub OIDC provider when this environment owns
 *          the account. The trust names the audience and the exact subject `repo:<org>/<repo>:environment:<env>`, so
 *          only a job bound to that GitHub environment (behind its reviewers for production) gets the role.
 * Boundary: internal; no access key exists (ADR 0172: no IAM users). The role carries AdministratorAccess because it
 *           applies the whole program; pull-request previews do not use it. The provider's ARN is fixed, so an
 *           environment that shares the account trusts it without creating it.
 * Runtime: node
 * Governing contract: ADR 0171 (stacks applied from CI), ADR 0170 (decision 6: production behind approval), ADR 0172
 *                     (decision 1: roles, no IAM users), ADR 0167 (CI over OIDC).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { ADMINISTRATOR_ACCESS } from "#node/constants/administrator-access.constant";
import { policyOf } from "#node/functions/policy-of.function";

/** GitHub Actions' OIDC issuer host. */
const ISSUER = "token.actions.githubusercontent.com";

/**
 * The infra role.
 *
 * @param args.createProvider - create the account's GitHub OIDC provider (the account's first environment does).
 */
export function ciAccess(
  name: string,
  args: {
    account: string;
    environment: string;
    github: { org: string; repo: string };
    roleName: string;
    createProvider: boolean;
  },
  opts: pulumi.CustomResourceOptions,
): aws.iam.Role {
  const providerArn = args.createProvider
    ? new aws.iam.OpenIdConnectProvider(
        name,
        { url: `https://${ISSUER}`, clientIdLists: ["sts.amazonaws.com"] },
        opts,
      ).arn
    : pulumi.output(`arn:aws:iam::${args.account}:oidc-provider/${ISSUER}`);
  const role = new aws.iam.Role(
    `${name}-infra`,
    {
      name: args.roleName,
      maxSessionDuration: 3600,
      assumeRolePolicy: policyOf([
        {
          Effect: "Allow",
          Principal: { Federated: providerArn },
          Action: "sts:AssumeRoleWithWebIdentity",
          Condition: {
            StringEquals: {
              [`${ISSUER}:aud`]: "sts.amazonaws.com",
              [`${ISSUER}:sub`]: `repo:${args.github.org}/${args.github.repo}:environment:${args.environment}`,
            },
          },
        },
      ]),
    },
    opts,
  );
  new aws.iam.RolePolicyAttachment(
    `${name}-infra-admin`,
    { role: role.name, policyArn: ADMINISTRATOR_ACCESS },
    opts,
  );
  return role;
}
