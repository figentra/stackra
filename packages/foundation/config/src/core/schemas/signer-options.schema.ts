/**
 * Stackra file contract:
 * Purpose: `SignerOptions`, the shape of `SignerConfig`: the key id each signature names and the KMS key the `kms`
 *          driver of the `Signer` port signs with.
 * Boundary: a shape class; it registers this package's own schema (`SIGNER_CONFIG_SCHEMA`) for itself when the module
 *           loads. Ids only: the private key stays in KMS, or in process for the `ephemeral` driver, and is never
 *           configured.
 * Runtime: isomorphic
 * Governing contract: ADR 0416; ADR 0146 as amended; ADR 0294 (decisions 19 and 26).
 */
import "#core/types/signer-driver-names.type";

import type { DriverName } from "@stackra/container";
import type { Signer } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { SIGNER_CONFIG_SCHEMA } from "#core/constants/signer-config-schema.constant";

/**
 * The signer's settings.
 *
 * @example
 * export class SignerConfig extends BaseSignerConfig {
 *   override driver = "kms" as const;
 *   override keyId = "usage-2026";
 *   override kmsKeyId = "alias/usage-signing";
 * }
 */
export class SignerOptions extends Schema {
  /** Which `Signer` driver runs: `ephemeral` (a key pair in process, dev and tests) or `kms` (production). */
  driver: DriverName<Signer> = "ephemeral";

  /** The id each signature names, so a verifier picks the key; empty means the KMS key id, or `ephemeral`. */
  keyId = "";

  /** The KMS key id, ARN or alias the `kms` driver signs with; it refuses to sign while this is empty. */
  kmsKeyId = "";

  /** The KMS region the `aws-sdk` client calls (`me-central-1`); empty means the SDK's default (`AWS_REGION`). */
  region = "";
}

registerSchemas([[SignerOptions, SIGNER_CONFIG_SCHEMA]]);
