/**
 * Stackra file contract:
 * Purpose: `IssuerOptions`, the fields of `IssuerConfig`: which `LicenceIssuer` driver writes licences, the Keygen
 *          product token, and the Stackra registry origin and issuer token that may create, renew and suspend them.
 * Boundary: a shape class with defaults; it registers this package's own schema for itself when the module loads. The
 *           Keygen origin and account are `LicensingConfig`'s (the same ones the verifier reads), never repeated here.
 *           The tokens are resolved blind from the secret store by their names (ADR 0173); only the issuing service sets
 *           them, never an install.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0173; ADR 0178 (decision 2); ADR 0453 (decisions 14 and 15); OS ADR 0039 d5.
 */
import "#core/types/licence-issuer-driver-names.type";

import { Secret } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import { ISSUER_CONFIG_SCHEMA } from "#core/constants/issuer-config-schema.constant";
import type { LicenceIssuer } from "#core/ports/licence-issuer.port";

/**
 * The issuer settings; runway sets the driver per environment (`memory` in dev and preview).
 *
 * @example
 * export class IssuerConfig extends BaseIssuerConfig {
 *   override driver: DriverName<LicenceIssuer> = "memory";
 * }
 */
export class IssuerOptions extends Schema {
  /** The Keygen product token; only the `keygen` driver reads it. Empty until the secret is set. */
  @Secret("KEYGEN_PRODUCT_TOKEN")
  productToken = "";

  /** The registry issuer token (role `issuer`); only the `registry` driver reads it. Empty until the secret is set. */
  @Secret("REGISTRY_ISSUER_TOKEN")
  issuerToken = "";

  /** The Stackra registry origin the `registry` driver calls (`/-/stackra/v1/licences`). */
  registryUrl = "https://npm.stackra.figentra.com";

  /**
   * The `LicenceIssuer` driver: `registry` writes Stackra registry licences (the default), `keygen` writes Keygen
   * licences for an on-prem customer, `memory` keeps them in the process.
   */
  driver: DriverName<LicenceIssuer> = "registry";
}

registerSchemas([[IssuerOptions, ISSUER_CONFIG_SCHEMA]]);
