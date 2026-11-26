/**
 * Stackra file contract:
 * Purpose: `EdgeOptions`, the shape of `EdgeConfig`: which driver answers the edge signing keys, which keeps the seen
 *          request ids, and the signing keys the `env` driver reads.
 * Boundary: a shape class; it registers this package's own schema (`EDGE_CONFIG_SCHEMA`) for itself when the module
 *           loads. The defaults are `memory` (ADR 0266 decision 2): with no key every signed request is refused, and a
 *           replay is refused per instance until a shared nonce store ships. A deployment behind the edge names `env`
 *           in runway and sets the secret. The keys are the `STACKRA_EDGE_SIGNING_KEYS` secret, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 4); ADR 0266; ADR 0294 (decisions 4, 19 and 26); ADR 0173.
 */
import "#core/types/edge-driver-names.type";

import { Secret } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import type { EdgeNonceStore } from "#contracts/ports/edge-nonce-store.port";
import type { EdgeSigningKeys } from "#contracts/ports/edge-signing-keys.port";
import { EDGE_CONFIG_SCHEMA } from "#core/constants/edge-config-schema.constant";

/**
 * The edge signature's drivers and keys.
 * @example
 * export class EdgeConfig extends BaseEdgeConfig {
 *   override keys: DriverName<EdgeSigningKeys> = "env";
 * }
 */
export class EdgeOptions extends Schema {
  /** The edge Worker's signing keys, newest first, comma-separated (two during a rotation); empty until set. */
  @Secret("STACKRA_EDGE_SIGNING_KEYS")
  signingKeys = "";

  /** Which driver answers the active signing keys: `memory` (tests) or `env` (the secret above). */
  keys: DriverName<EdgeSigningKeys> = "memory";

  /** Where seen request ids are kept: `memory` (per instance). */
  nonces: DriverName<EdgeNonceStore> = "memory";
}

registerSchemas([[EdgeOptions, EDGE_CONFIG_SCHEMA]]);
