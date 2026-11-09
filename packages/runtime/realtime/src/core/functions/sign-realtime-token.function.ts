/**
 * Stackra file contract:
 * Purpose: `signRealtimeToken`, a signed realtime token: `signedToken` over `{ id, grant }` for a purpose
 *          (`realtime.subscribe` or `realtime.room`) until `expiresAt`, with a fresh id the ledger records on
 *          redemption, so any instance that holds the key verifies it and redeems it once.
 * Boundary: the grant is signed, not encrypted: it carries ids, a realm and permission names, never a secret. A token
 *           travels in a URL query, so its lifetime is the short `subscribeTokenTtl`.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0346 (decision 3); STA-934 (`signedToken`).
 */
import { signedToken } from "@stackra/support";

import { realtimeTokenKeys } from "#core/functions/realtime-token-keys.function";

/**
 * A token carrying `grant` for `purpose`.
 *
 * @param tokenKey - the `REALTIME_TOKEN_KEY` secret's value.
 * @example
 * const token = await signRealtimeToken(config.tokenKey, "realtime.room", grant, expiresAt);
 */
export function signRealtimeToken(
  tokenKey: string,
  purpose: string,
  grant: unknown,
  expiresAt: Date,
): Promise<string> {
  return signedToken.sign(realtimeTokenKeys(tokenKey), {
    purpose,
    expiresAt,
    data: { id: crypto.randomUUID(), grant },
  });
}
