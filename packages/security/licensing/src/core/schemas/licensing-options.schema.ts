/**
 * Stackra file contract:
 * Purpose: `LicensingOptions`, the fields of `LicensingConfig`: the licence API origin, the issuing account and its
 *          Ed25519 verify key.
 * Boundary: a plain shape class with defaults: Keygen's hosted API as the default origin (a value an environment
 *           replaces, never a constant in code), and no account or key until the host sets them. It registers this
 *           package's own schema for itself when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0178 (decisions 1 and 5); owner round 3 #37.
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { LICENSING_CONFIG_SCHEMA } from "#core/constants/licensing-config-schema.constant";

/**
 * The licensing settings.
 *
 * @example
 * export class LicensingConfig extends Config({ schema: LicensingOptions }) {}
 */
export class LicensingOptions extends Schema {
  /** The licence API origin; Keygen's hosted API by default, a self-hosted server's origin on an air-gapped install. */
  apiUrl = "https://api.keygen.sh";

  /** The account id or slug that issued the licences; empty until the host sets it. */
  account = "";

  /** The account's Ed25519 verify key, 64 hex characters; empty until the host sets it. */
  publicKey = "";
}

registerSchemas([[LicensingOptions, LICENSING_CONFIG_SCHEMA]]);
