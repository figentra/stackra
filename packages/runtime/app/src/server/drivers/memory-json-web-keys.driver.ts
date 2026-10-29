/**
 * Stackra file contract:
 * Purpose: `MemoryJsonWebKeysDriver` (`memory`), the `JsonWebKeys` driver that holds public keys in process memory: the
 *          candidate of tests and local runs, where a test signs a token with a key pair it generated.
 * Boundary: no network. `keys` starts empty, so an unconfigured guard refuses every token.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";

import { JsonWebKeys } from "#contracts/ports/json-web-keys.port";

/**
 * Public signing keys in memory.
 *
 * @example
 * const keys = new MemoryJsonWebKeysDriver();
 * keys.keys = [{ ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" }];
 */
export class MemoryJsonWebKeysDriver extends Driver(JsonWebKeys) {
  /** The public keys, each with its `kid`. */
  keys: (JsonWebKey & { kid?: string })[] = [];

  /** The key whose `kid` is `kid`, or null. */
  async find(kid: string): Promise<JsonWebKey | null> {
    return this.keys.find((key) => key.kid === kid) ?? null;
  }
}
