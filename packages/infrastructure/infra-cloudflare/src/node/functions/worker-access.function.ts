/**
 * Stackra file contract:
 * Purpose: `workerAccess(args)`, Cloudflare Access in front of the Worker members of the `internal-tool` preset: per
 *          member one self-hosted application over its custom domains and, when the account's `workers.dev`
 *          subdomain is known, one over its Version URLs (`<version>-<worker>.<subdomain>.workers.dev`), both open to
 *          the GitHub organisation (a machine's service token is a later addition).
 * Boundary: declares Pulumi resources only. The identity provider is referenced by id, as `accessGate` does. Rendering the Worker's own config is the runway provider's.
 * Runtime: node
 * Governing contract: ADR 0519 (decision 4); ADR 0290 (decisions 2 and 6).
 */
import * as cloudflare from "@pulumi/cloudflare";

import type { CloudflareStack } from "#core/types/cloudflare-stack.type";

/**
 * The Access policy and applications of the internal-tool Workers.
 *
 * @param args - the account id, the project, the resolved identity provider id, the stack's Access config, the
 *               account's `workers.dev` subdomain and each member's custom domains.
 * @example
 * workerAccess({ accountId, project: "figentra", identityProviderId, access, workersDevSubdomain: "figentra", members: { console: { hostnames: ["console.figentra.cloud"] } } });
 */
export function workerAccess(args: {
  readonly accountId: string;
  readonly project: string;
  readonly identityProviderId: string;
  readonly access: NonNullable<CloudflareStack["access"]>;
  readonly workersDevSubdomain?: string | undefined;
  readonly members: Readonly<Record<string, { readonly hostnames: readonly string[] }>>;
}): {
  policy: cloudflare.ZeroTrustAccessPolicy;
  applications: cloudflare.ZeroTrustAccessApplication[];
} {
  const { accountId, project, identityProviderId, access, workersDevSubdomain, members } = args;
  const policy = new cloudflare.ZeroTrustAccessPolicy("access-worker-github", {
    accountId,
    name: `${project} worker github`,
    decision: "allow",
    includes: [{ githubOrganization: { identityProviderId, name: access.githubOrganization } }],
    sessionDuration: access.sessionDuration,
  });
  const application = (id: string, uris: readonly string[]) =>
    new cloudflare.ZeroTrustAccessApplication(`access-worker-${id}`, {
      accountId,
      name: `${project} worker ${id}`,
      type: "self_hosted",
      domain: uris[0],
      destinations: uris.map((uri) => ({ type: "public", uri })),
      allowedIdps: [identityProviderId],
      autoRedirectToIdentity: true,
      sessionDuration: access.sessionDuration,
      policies: [{ id: policy.id, precedence: 1 }],
    });
  const applications = Object.entries(members).flatMap(([name, member]) => [
    ...(member.hostnames.length === 0 ? [] : [application(name, member.hostnames)]),
    ...(workersDevSubdomain === undefined
      ? []
      : [application(`${name}-versions`, [`*-${name}.${workersDevSubdomain}.workers.dev`])]),
  ]);
  return { policy, applications };
}
