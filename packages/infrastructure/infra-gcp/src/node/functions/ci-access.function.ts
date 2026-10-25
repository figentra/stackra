/**
 * Stackra file contract:
 * Purpose: `ciAccess(name, args, opts)`, the environment's infra service account that a GitHub Actions job impersonates
 *          through Workload Identity Federation to apply the environment's Pulumi program: a pool and a GitHub OIDC
 *          provider of the environment's own whose condition admits only the exact subject
 *          `repo:<org>/<repo>:environment:<env>`, the service account, the right for that one subject to impersonate
 *          it, and the owner role on the project.
 * Boundary: internal; no service account key exists (ADR 0172: no long-lived credentials). The service account is the
 *           project's owner because it applies the whole program; pull-request previews do not use it. Each environment
 *           has its own pool (`<env>-github`), so two environments sharing a project need no owner between them; a
 *           deleted pool keeps its id for 30 days.
 * Runtime: node
 * Governing contract: ADR 0171 (stacks applied from CI), ADR 0170 (decision 6: production behind approval), ADR 0172
 *                     (decision 1), ADR 0167 (CI over OIDC), ADR 0354 (decision 3).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

/** GitHub Actions' OIDC issuer host. */
const ISSUER = "token.actions.githubusercontent.com";

/**
 * The infra service account and the Workload Identity provider a deploy job authenticates with.
 *
 * @param args.accountId - the service account's fixed id (`serviceAccountId`).
 */
export function ciAccess(
  name: string,
  args: {
    project: string;
    environment: string;
    github: { org: string; repo: string };
    accountId: string;
  },
  opts: pulumi.CustomResourceOptions,
): { serviceAccount: gcp.serviceaccount.Account; provider: gcp.iam.WorkloadIdentityPoolProvider } {
  const subject = `repo:${args.github.org}/${args.github.repo}:environment:${args.environment}`;
  const pool = new gcp.iam.WorkloadIdentityPool(
    `${name}-github`,
    {
      project: args.project,
      workloadIdentityPoolId: `${args.environment}-github`,
      displayName: `GitHub ${args.environment}`,
    },
    opts,
  );
  const provider = new gcp.iam.WorkloadIdentityPoolProvider(
    `${name}-github`,
    {
      project: args.project,
      workloadIdentityPoolId: pool.workloadIdentityPoolId,
      workloadIdentityPoolProviderId: "github",
      attributeMapping: { "google.subject": "assertion.sub" },
      attributeCondition: `assertion.sub == "${subject}"`,
      oidc: { issuerUri: `https://${ISSUER}` },
    },
    opts,
  );
  const serviceAccount = new gcp.serviceaccount.Account(
    `${name}-infra`,
    {
      project: args.project,
      accountId: args.accountId,
      displayName: `${args.environment} infra (GitHub deploy)`,
    },
    opts,
  );
  new gcp.serviceaccount.IAMMember(
    `${name}-infra-github`,
    {
      serviceAccountId: serviceAccount.name,
      role: "roles/iam.workloadIdentityUser",
      member: pulumi.interpolate`principal://iam.googleapis.com/${pool.name}/subject/${subject}`,
    },
    { ...opts, dependsOn: [provider] },
  );
  new gcp.projects.IAMMember(
    `${name}-infra-owner`,
    {
      project: args.project,
      role: "roles/owner",
      member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
    },
    opts,
  );
  return { serviceAccount, provider };
}
