/**
 * Stackra file contract:
 * Purpose: `accessGate(args)`, Cloudflare Access in front of every non-production host and the production operator
 *          surfaces: one self-hosted application over `*.<dev zone>` (dev, tunnel, preview and staging hosts are one
 *          label deep there), one over the operator URIs, both open to the GitHub organisation and to the machines'
 *          service tokens; and one application over the callback and webhook paths that bypasses Access.
 * Boundary: declares Pulumi resources only. The GitHub identity provider is referenced by id, not created: its OAuth
 *           client secret is the owner's to place. A service token's client secret stays in the encrypted stack state
 *           and is never exported. Tenant admin stays behind the identity provider alone (ADR 0290 decision 11), so no
 *           tenant host is listed here. Signed webhooks are still verified behind a bypass (ADR 0224).
 * Runtime: node (Pulumi program)
 * Governing contract: ADR 0290 (decisions 2, 6 and 11; amends ADR 0237 layer 1).
 */
import * as cloudflare from "@pulumi/cloudflare";

import type { CloudflareStack } from "#core/types/cloudflare-stack.type";

/**
 * The Access policies, applications and service tokens of the core stack.
 *
 * @param args - the account id, the project (a name prefix), the dev zone, the resolved GitHub identity provider id
 *               and the stack's Access config.
 * @example
 * accessGate({ accountId, project: "figentra", devZone: "figentra.cloud", identityProviderId, access: stack.access });
 */
export function accessGate(args: {
  readonly accountId: string;
  readonly project: string;
  readonly devZone: string;
  readonly identityProviderId: string;
  readonly access: NonNullable<CloudflareStack["access"]>;
}) {
  const { accountId, project, devZone, identityProviderId, access } = args;
  const policy = (
    id: string,
    decision: string,
    includes: cloudflare.types.input.ZeroTrustAccessPolicyInclude[],
  ) =>
    new cloudflare.ZeroTrustAccessPolicy(`access-${id}`, {
      accountId,
      name: `${project} ${id}`,
      decision,
      includes,
      sessionDuration: access.sessionDuration,
    });
  const github = policy("github", "allow", [
    { githubOrganization: { identityProviderId, name: access.githubOrganization } },
  ]);
  const serviceTokens = access.serviceTokens.map(
    (token) =>
      new cloudflare.ZeroTrustAccessServiceToken(`access-token-${token}`, {
        accountId,
        name: `${project}-${token}`,
      }),
  );
  const machines =
    serviceTokens.length === 0
      ? undefined
      : policy(
          "machines",
          "non_identity",
          serviceTokens.map((token) => ({ serviceToken: { tokenId: token.id } })),
        );
  const bypass =
    access.bypass.length === 0 ? undefined : policy("bypass", "bypass", [{ everyone: {} }]);
  const policies = [github, machines, bypass].filter((entry) => entry !== undefined);

  const guarded = [github, machines].flatMap((entry, index) =>
    entry === undefined ? [] : [{ id: entry.id, precedence: index + 1 }],
  );
  const application = (
    id: string,
    uris: readonly string[],
    rules: cloudflare.types.input.ZeroTrustAccessApplicationPolicy[],
  ) =>
    new cloudflare.ZeroTrustAccessApplication(`access-${id}`, {
      accountId,
      name: `${project} ${id}`,
      type: "self_hosted",
      domain: uris[0],
      destinations: uris.map((uri) => ({ type: "public", uri })),
      allowedIdps: [identityProviderId],
      autoRedirectToIdentity: true,
      sessionDuration: access.sessionDuration,
      policies: rules,
    });
  const applications = [
    application("dev", [`*.${devZone}`], guarded),
    ...(access.operatorUris.length === 0
      ? []
      : [application("operator", access.operatorUris, guarded)]),
    ...(bypass === undefined
      ? []
      : [application("bypass", access.bypass, [{ id: bypass.id, precedence: 1 }])]),
  ];
  return { policies, applications, serviceTokens };
}
