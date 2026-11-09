/**
 * Stackra file contract:
 * Purpose: `realtimeTokenKeys(tokenKey)`, the `SigningKeySource` realtime tokens are signed and verified with: the one
 *          key of the `REALTIME_TOKEN_KEY` secret, under the key id `realtime`.
 * Boundary: pure. One key, so a rotation is a deploy of every instance with the new secret; tokens issued before it are
 *           refused after it and the client asks for a new one, as it does at expiry.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0173 (secrets by name).
 */
import type { SigningKeySource } from "@stackra/support";

/** The key id every realtime token names. */
const KEY_ID = "realtime";

/**
 * The key source over `tokenKey`.
 *
 * @param tokenKey - the `REALTIME_TOKEN_KEY` secret's value.
 * @example
 * const token = await signedToken.sign(realtimeTokenKeys(config.tokenKey), { purpose, expiresAt, data });
 */
export function realtimeTokenKeys(tokenKey: string): SigningKeySource {
  const key = { id: KEY_ID, key: new TextEncoder().encode(tokenKey) };
  return {
    current: async () => key,
    byId: async (id: string) => {
      if (id !== KEY_ID) throw new RangeError(`no realtime token key ${id}`);
      return key;
    },
  };
}
