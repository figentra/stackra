/**
 * Stackra file contract:
 * Purpose: `MemoryEdgeSigningKeysDriver` (`memory`), the `EdgeSigningKeys` driver that holds the active secrets in
 *          process memory: the candidate of tests and local runs, where a test signs a request with a key it chose.
 * Boundary: no network and no secret store. `secrets` is newest first and starts empty, so an unconfigured API
 *           refuses every signed request. Production binds a secret-store driver in its place (configuration).
 * Runtime: node
 * Governing contract: ADR 0437 (decision 4); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";

import { EdgeSigningKeys } from "#contracts/ports/edge-signing-keys.port";

/**
 * Edge signing secrets in memory.
 *
 * @example
 * const keys = new MemoryEdgeSigningKeysDriver();
 * keys.secrets = ["next", "previous"];
 */
export class MemoryEdgeSigningKeysDriver extends Driver(EdgeSigningKeys) {
  /** The active secrets, newest first. */
  secrets: string[] = [];

  /** The active secrets, newest first. */
  async active(): Promise<readonly string[]> {
    return this.secrets;
  }
}
