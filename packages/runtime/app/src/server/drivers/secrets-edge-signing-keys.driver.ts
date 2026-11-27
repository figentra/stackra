/**
 * Stackra file contract:
 * Purpose: `SecretsEdgeSigningKeysDriver` (`secrets`), the `EdgeSigningKeys` driver that reads the active secrets from
 *          the bound `SecretStore` by name (`EdgeConfig.signingKeysSecret`, `STACKRA_EDGE_SIGNING_KEYS` by default) on
 *          every check, comma-separated and newest first, so it answers whatever the bound store holds at that moment.
 * Boundary: reads one secret by its configured name and lists nothing; an unset or blank secret answers no key, so every
 *           signed request is refused. A store that throws (one not loaded yet) rejects the check, which fails closed.
 *           In every shipped target `bootApp` binds the environment the process (or Worker) started with as the
 *           `SecretStore`, not the wiring's `secrets.store` driver, and nothing reloads it, so today this driver
 *           answers the same keys as `env` and a rotation still needs a restart. It follows a rotation without one
 *           only when the bound store itself reloads: a `bootApp` caller's `SecretStore` override it reloads, or the
 *           reloading boot store of STA-2804. The values are never logged, kept or returned past the guard.
 * Runtime: node
 * Governing contract: ADR 0437 (decision 4: two signing keys, rotated without a cut-over); ADR 0173 (secrets by name);
 *                     ADR 0525; ADR 0263.
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";

import type { EdgeConfig } from "#config/edge.config";
import { EdgeSigningKeys } from "#contracts/ports/edge-signing-keys.port";
import { edgeSigningKeysOf } from "#server/functions/edge-signing-keys-of.function";

/**
 * Edge signing secrets from the secret store, read on every check.
 *
 * @example
 * // runway: config.app.edge.keys: secrets, with STACKRA_EDGE_SIGNING_KEYS in the bound store (today: the environment)
 * const [newest] = await keys.active();
 */
export class SecretsEdgeSigningKeysDriver extends Driver(EdgeSigningKeys) {
  /** Where the keys are read from, by name. */
  private readonly secrets: SecretStore;

  /** Holds the secret's name. */
  private readonly config: EdgeConfig;

  /**
   * @param secrets - the runtime's secret store.
   * @param config - names the secret (`signingKeysSecret`).
   */
  constructor(secrets: SecretStore, config: EdgeConfig) {
    super();
    this.secrets = secrets;
    this.config = config;
  }

  /** The secrets, newest first, as the store holds them now; empty when the secret is unset. */
  async active(): Promise<readonly string[]> {
    return edgeSigningKeysOf(this.secrets.get(this.config.signingKeysSecret));
  }
}
