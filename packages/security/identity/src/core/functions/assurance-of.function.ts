/**
 * Stackra file contract:
 * Purpose: `assuranceOf`, the assurance a verified token's claims carry: the strongest level its authentication methods
 *          (`amr`, RFC 8176) reach under `IdentityConfig.assuranceByMethod`, and its `auth_time`.
 * Boundary: pure; reads claims that were already verified (the gateway's or the PKCE driver's). An unknown method
 *           reaches no level; a token without `amr` or `auth_time` leaves that part `undefined`, which a step-up check
 *           reads as not enough.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 1: the AAL in the token); RFC 8176; OpenID Connect Core (`auth_time`).
 */
import { Enum } from "@stackra/contracts";

import type { IdentityConfig } from "#config/identity.config";
import { AssuranceLevel } from "#core/enums/assurance-level.enum";
import type { Assurance } from "#core/types/assurance.type";

/** The levels, weakest first. */
const ORDER: readonly AssuranceLevel[] = Enum.values(AssuranceLevel);

/**
 * The assurance of `claims`.
 *
 * @example
 * const { level, authenticatedAt } = assuranceOf(verified.claims, identity);
 */
export function assuranceOf(
  claims: Readonly<Record<string, unknown>>,
  config: Pick<IdentityConfig, "assuranceByMethod">,
): Assurance {
  const methods = Array.isArray(claims.amr) ? claims.amr : [];
  let level: AssuranceLevel | undefined;
  for (const method of methods) {
    const reached =
      typeof method === "string" && Object.hasOwn(config.assuranceByMethod, method)
        ? config.assuranceByMethod[method]
        : undefined;
    const stronger = level === undefined || ORDER.indexOf(reached ?? level) > ORDER.indexOf(level);
    if (reached !== undefined && stronger) level = reached;
  }
  const time = claims.auth_time;
  return {
    level,
    authenticatedAt:
      typeof time === "number" && Number.isFinite(time) ? new Date(time * 1000) : undefined,
  };
}
