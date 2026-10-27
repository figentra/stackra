/**
 * Stackra file contract:
 * Purpose: `exchangeToken`: the OIDC exchange.
 * Boundary: no long-lived token, no human identity; the audit row names the workflow run.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3 and 6).
 */
import { bearer } from "#src/access/bearer";
import { sha256Hex } from "#src/bytes/sha256-hex";
import { toBase64Url } from "#src/bytes/to-base64-url";
import { PUBLISH_TOKEN_PREFIX } from "#src/constants/publish-token-prefix.constant";
import { failure } from "#src/http/failure";
import { json } from "#src/http/json";
import { splitName } from "#src/http/split-name";
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import { matchPublisher } from "#src/oidc/match-publisher";
import { OidcError } from "#src/oidc/oidc-error";
import { verifyGithubToken } from "#src/oidc/verify-github-token";

/**
 * The OIDC exchange.
 *
 * @example
 * await exchangeToken(deps, request, "@stackra/core"); // 201 { token: "stkp_…" }
 */
export async function exchangeToken(
  deps: RegistryDeps,
  request: Request,
  name: string,
): Promise<Response> {
  const idToken = bearer(request.headers.get("authorization"));
  if (idToken === null) return failure(401, "a GitHub Actions ID token is required");
  const scope = splitName(name).scope;
  if ((await deps.store.scope(scope)) === null) return failure(404, "not_found");
  const now = deps.now();
  let claims: GithubClaims;
  try {
    claims = await verifyGithubToken(idToken, {
      issuer: deps.settings.oidcIssuer,
      audience: `npm:${deps.settings.host}`,
      now,
      keys: deps.oidcKeys,
    });
  } catch (error) {
    if (error instanceof OidcError) return failure(401, error.message);
    throw error;
  }
  const publisher = matchPublisher(claims, await deps.store.publishers(scope));
  if (publisher === null)
    return failure(403, `this workflow is not the trusted publisher of ${scope}`);
  const token = PUBLISH_TOKEN_PREFIX + toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const run = `https://github.com/${claims.repository}/actions/runs/${claims.run_id}/attempts/${claims.run_attempt}`;
  await deps.store.savePublishToken(
    {
      hash: await sha256Hex(token),
      name,
      repository: publisher.repository,
      run,
      expires_at: new Date(now.getTime() + deps.settings.publishTokenSeconds * 1000).toISOString(),
    },
    {
      at: now.toISOString(),
      action: "token.exchange",
      name,
      actor: `ci:${publisher.repository}`,
      run,
    },
  );
  return json({ token }, 201);
}
