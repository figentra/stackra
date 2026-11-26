/**
 * Stackra file contract:
 * Purpose: `SignerConfig`, the configuration of the `Signer` drivers this package ships (key `config.signer`): the key
 *          id signatures name and the KMS key the `kms` driver signs with.
 * Boundary: a configuration class over `SignerOptions` with no env map; runway's layer sets it per environment. No
 *           credential: the runtime's AWS role signs the KMS calls.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0416.
 */
import { Config } from "#core/bases/config.base";
import { SignerOptions } from "#core/schemas/signer-options.schema";

/**
 * The signer's configuration.
 *
 * @example
 * const config = buildConfig(SignerConfig, { values: { kmsKeyId: "alias/usage-signing", keyId: "usage-2026" } });
 */
export class SignerConfig extends Config({ schema: SignerOptions }) {}
