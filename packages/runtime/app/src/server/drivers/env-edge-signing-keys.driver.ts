/**
 * Stackra file contract:
 * Purpose: `EnvEdgeSigningKeysDriver` (`env`), the `EdgeSigningKeys` driver of a deployment behind the edge: the active
 *          secrets are the `STACKRA_EDGE_SIGNING_KEYS` secret of `EdgeConfig`, comma-separated, newest first, so a
 *          rotation lists the new key before the old one and no deploy has to happen at once on both sides.
 * Boundary: reads only `EdgeConfig.signingKeys`; blanks are dropped, so an unset secret answers no key and every signed
 *           request is refused. Secrets are never logged or returned past the guard.
 * Runtime: node
 * Governing contract: ADR 0437 (decision 4: two signing keys); ADR 0173; ADR 0263.
 */
import { Driver } from "@stackra/container";

import type { EdgeConfig } from "#config/edge.config";
import { EdgeSigningKeys } from "#contracts/ports/edge-signing-keys.port";

/**
 * Edge signing secrets from the configured secret.
 *
 * @example
 * // runway: config.app.edge.keys: env, with STACKRA_EDGE_SIGNING_KEYS set
 * const [newest] = await keys.active();
 */
export class EnvEdgeSigningKeysDriver extends Driver(EdgeSigningKeys) {
  /**
   * @param config - holds the secret.
   */
  constructor(private readonly config: EdgeConfig) {
    super();
  }

  /** The secrets, newest first; empty when the secret is unset. */
  async active(): Promise<readonly string[]> {
    return this.config.signingKeys
      .split(",")
      .map((key) => key.trim())
      .filter((key) => key !== "");
  }
}
