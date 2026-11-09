/**
 * Stackra file contract:
 * Purpose: `redeemRealtimeToken`, the grant of a signed realtime token on whichever instance it reaches: the signature,
 *          purpose and expiry are checked, then the token's id is claimed in the `RealtimeTokenLedger`, so a second
 *          redemption (a replay from a captured URL) is refused.
 * Boundary: answers undefined for every refusal (bad signature, other purpose, expired, already redeemed, no data);
 *           the caller closes with its usual unauthorised code. The grant's shape is the caller's to check.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0346 (decision 3); STA-934 (`signedToken`).
 */
import { signedToken } from "@stackra/support";

import type { RealtimeTokenLedger } from "#contracts/ports/realtime-token-ledger.port";
import { realtimeTokenKeys } from "#core/functions/realtime-token-keys.function";

/**
 * The grant `token` carries, redeemed once; undefined when it is refused.
 *
 * @param tokenKey - the `REALTIME_TOKEN_KEY` secret's value.
 * @example
 * const grant = await redeemRealtimeToken(config.tokenKey, ledger, "realtime.room", token);
 */
export async function redeemRealtimeToken(
  tokenKey: string,
  ledger: RealtimeTokenLedger,
  purpose: string,
  token: string,
): Promise<{ readonly grant: unknown; readonly expiresAt: Date } | undefined> {
  const check = await signedToken.verify(realtimeTokenKeys(tokenKey), token, {
    purpose,
    now: new Date(),
  });
  if (!check.ok) return undefined;
  const data = check.data as { readonly id?: unknown; readonly grant?: unknown } | null;
  if (data === null || typeof data.id !== "string" || data.grant === undefined) return undefined;
  if (!(await ledger.claim(data.id, check.expiresAt))) return undefined;
  return { grant: data.grant, expiresAt: check.expiresAt };
}
