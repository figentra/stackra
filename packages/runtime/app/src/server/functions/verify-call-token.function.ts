/**
 * Stackra file contract:
 * Purpose: `verifyCallToken`, the verified claims of an inbound access token for `CallAuthenticator` and
 *          `BearerTokenGuard`: a dev token (STA-2795) when `devIssuerKeys` gives keys in the running environment and
 *          one of them signed it for `DEV_ISSUER`, else a token of the configured issuer under the bound `JsonWebKeys`
 *          (`verifyBearerToken`).
 * Boundary: the dev path exists only where `devIssuerKeys` answers keys: the running environment, which the caller
 *           takes from the one reader (`runningEnvironment`, STA-2844), is `dev`. A deployment with dev keys never
 *           boots, and without them a dev token is checked only against the real issuer, which refuses it (its `iss`
 *           and `aud` are not the issuer's and no published key has its `kid`). A dev token is held to the same checks
 *           as a real one (algorithm, signature, `iss`, `aud`, `exp`, `nbf`, leeway). Never throws on an untrusted
 *           token; an issuer that cannot be reached throws (an outage), and so do dev keys outside `dev`.
 * Runtime: node
 * Governing contract: ADR 0206 (decision 8 and its amendment of 2026-11-26: the dev issuer); ADR 0209 (amendment
 *                     of 2026-11-07, point 5: one authentication path); ADR 0296 (amendment 2026-11-26); STA-2844.
 */
import type { StackraEnvironment } from "@stackra/config";

import type { BearerConfig } from "#config/bearer.config";
import type { JsonWebKeys } from "#contracts/ports/json-web-keys.port";
import { DEV_ISSUER } from "#core/constants/dev-issuer.constant";
import { verifyBearerToken } from "#core/functions/verify-bearer-token.function";
import { devIssuerKeys } from "#server/functions/dev-issuer-keys.function";

/**
 * The claims of `token`, or undefined when it verifies under neither the dev issuer nor the configured one.
 *
 * @param token - the compact JWT, without the `Bearer ` prefix.
 * @param config - the issuer, audience, leeway and the dev issuer's key set.
 * @param keys - the configured issuer's key source.
 * @param environment - the running environment, from the one reader (`readEnvironment`); dev tokens pass only in `dev`.
 * @throws Error when the configured issuer cannot be reached.
 * @throws ConfigInvalidError when dev keys are set outside `dev` (boot refuses this first).
 * @example
 * const claims = await verifyCallToken(token, container.get(BearerConfig), container.get(JsonWebKeys), environment);
 */
export async function verifyCallToken(
  token: string,
  config: BearerConfig,
  keys: JsonWebKeys,
  environment: StackraEnvironment,
): Promise<Readonly<Record<string, unknown>> | undefined> {
  const now = new Date();
  const dev = devIssuerKeys(config, environment);
  if (dev !== undefined) {
    const claims = await verifyBearerToken(token, {
      issuer: DEV_ISSUER.issuer,
      audience: DEV_ISSUER.audience,
      leewaySeconds: config.leewaySeconds,
      now,
      keys: async (kid) => dev.find((key) => key.kid === kid) ?? null,
    });
    if (claims !== undefined) return claims;
  }
  return verifyBearerToken(token, {
    issuer: config.issuer,
    audience: config.audience,
    leewaySeconds: config.leewaySeconds,
    now,
    keys: (kid) => keys.find(kid),
  });
}
