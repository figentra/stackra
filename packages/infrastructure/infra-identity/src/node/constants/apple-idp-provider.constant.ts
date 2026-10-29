/**
 * Stackra file contract:
 * Purpose: `APPLE_IDP_PROVIDER`, the Pulumi dynamic provider behind the instance's Apple identity provider: it signs in
 *          to ZITADEL's admin API with the provisioner's key (JWT profile grant), adds, updates or deletes the Apple
 *          provider, and allows it on the instance's default login policy.
 * Boundary: `@pulumiverse/zitadel` 0.2.0 has no Apple resource, so this calls ZITADEL's admin API directly
 *           (`/admin/v1/idps/apple`, `/admin/v1/policies/login/idps`, `/admin/v1/idps/templates/{id}`). The `.p8` key
 *           arrives as a secret input and never leaves in outputs, a log or an error: the state keeps the public ids
 *           and a SHA-256 of the key, only to see a rotation. The provisioner's key stays in the state, encrypted as a
 *           Pulumi secret (`appleIdp` marks it), because a delete gets nothing else to sign in with. Node built-ins
 *           are imported inside each call so Pulumi's closure serialisation captures no module.
 * Runtime: node
 * Governing contract: ADR 0171 (decision 2), ADR 0173 (no secret value in state), ADR 0206 (decision 8), STA-1578
 *                     (App Store guideline 4.8).
 */
import type { dynamic } from "@pulumi/pulumi";

import type { AppleIdpInputs } from "#node/types/apple-idp-inputs.type";

/** What the state keeps: public ids, the key's digest and the provisioner's key (a secret output). */
type AppleIdpOutputs = {
  readonly domain: string;
  readonly jwtProfileJson: string;
  readonly clientId: string;
  readonly teamId: string;
  readonly keyId: string;
  readonly keyHash: string;
};

/** The provider's name on the hosted sign-in page. */
const NAME = "Apple";

/** One base64url JSON part of a JWT. */
function part(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

/** The JSON body of a ZITADEL admin call, or a status-only error (a body may echo input). */
async function admin(
  inputs: Pick<AppleIdpInputs, "domain" | "jwtProfileJson">,
  method: string,
  path: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const { createSign } = await import("node:crypto");
  const profile = JSON.parse(inputs.jwtProfileJson) as {
    keyId: string;
    key: string;
    userId: string;
  };
  const issuer = `https://${inputs.domain}`;
  const now = Math.floor(Date.now() / 1000);
  const signed = `${part({ alg: "RS256", kid: profile.keyId })}.${part({
    iss: profile.userId,
    sub: profile.userId,
    aud: issuer,
    iat: now,
    exp: now + 300,
  })}`;
  const assertion = `${signed}.${createSign("RSA-SHA256").update(signed).sign(profile.key, "base64url")}`;
  const token = await fetch(`${issuer}/oauth/v2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      scope: "openid urn:zitadel:iam:org:project:id:zitadel:aud",
      assertion,
    }),
  });
  if (!token.ok) throw new Error(`ZITADEL refused the provisioner's key (HTTP ${token.status})`);
  const { access_token: accessToken } = (await token.json()) as { access_token: string };
  const response = await fetch(`${issuer}${path}`, {
    method,
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw new Error(`ZITADEL ${method} ${path} failed (HTTP ${response.status})`);
  return (await response.json()) as Record<string, unknown>;
}

/** The Apple provider's body: the ids, the base64 key and the account options. */
function bodyOf(inputs: AppleIdpInputs): Record<string, unknown> {
  return {
    name: NAME,
    clientId: inputs.clientId,
    teamId: inputs.teamId,
    keyId: inputs.keyId,
    privateKey: Buffer.from(inputs.privateKey).toString("base64"),
    scopes: ["name", "email"],
    // A person signing in with Apple gets an account; no auto-linking by email (Apple may relay a private address).
    providerOptions: {
      isLinkingAllowed: true,
      isCreationAllowed: true,
      isAutoCreation: true,
      isAutoUpdate: false,
    },
  };
}

/** The state of `inputs`. */
async function outputsOf(inputs: AppleIdpInputs): Promise<AppleIdpOutputs> {
  const { createHash } = await import("node:crypto");
  return {
    domain: inputs.domain,
    jwtProfileJson: inputs.jwtProfileJson,
    clientId: inputs.clientId,
    teamId: inputs.teamId,
    keyId: inputs.keyId,
    keyHash: createHash("sha256").update(inputs.privateKey).digest("hex"),
  };
}

/**
 * The dynamic provider of the Apple identity provider.
 *
 * @example
 * new dynamic.Resource(APPLE_IDP_PROVIDER, "apple-idp", { domain, jwtProfileJson, clientId, teamId, keyId, privateKey });
 */
export const APPLE_IDP_PROVIDER: dynamic.ResourceProvider = {
  async create(inputs: AppleIdpInputs): Promise<dynamic.CreateResult> {
    const created = await admin(inputs, "POST", "/admin/v1/idps/apple", bodyOf(inputs));
    const id = String(created["id"]);
    await admin(inputs, "POST", "/admin/v1/policies/login/idps", { idpId: id });
    return { id, outs: await outputsOf(inputs) };
  },

  async diff(
    _id: string,
    olds: AppleIdpOutputs,
    news: AppleIdpInputs,
  ): Promise<dynamic.DiffResult> {
    const next = await outputsOf(news);
    const changed = (Object.keys(next) as (keyof AppleIdpOutputs)[]).filter(
      (key) => olds[key] !== next[key],
    );
    return {
      changes: changed.length > 0,
      replaces: changed.includes("domain") ? ["domain"] : [],
      deleteBeforeReplace: true,
    };
  },

  async update(
    id: string,
    _olds: AppleIdpOutputs,
    news: AppleIdpInputs,
  ): Promise<dynamic.UpdateResult> {
    await admin(news, "PUT", `/admin/v1/idps/apple/${id}`, bodyOf(news));
    return { outs: await outputsOf(news) };
  },

  async delete(id: string, olds: AppleIdpOutputs): Promise<void> {
    await admin(olds, "DELETE", `/admin/v1/policies/login/idps/${id}`).catch(() => undefined);
    await admin(olds, "DELETE", `/admin/v1/idps/templates/${id}`);
  },
};
