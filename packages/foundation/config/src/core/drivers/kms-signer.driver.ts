/**
 * Stackra file contract:
 * Purpose: the `kms` driver of @stackra/contracts' `Signer` port: ES256 signatures made inside AWS KMS with the
 *          configured `ECC_NIST_P256` key, so a service that injects `Signer` gets a driver gen can bind.
 * Boundary: the container's twin of @stackra/contracts' `AwsKmsSignerDriver`, which this driver delegates to: its
 *           constructor takes the `SignerConfig` and the bound `KmsClient` (`aws-sdk` by default), both from the container. The delegate is
 *           built on first use, so an empty `kmsKeyId` is refused when the first signature or key is asked for (a
 *           RangeError naming no key material). The private key never leaves KMS.
 * Runtime: isomorphic
 * Governing contract: ADR 0416; ADR 0212 (decision 3); ADR 0263 (a driver is named by its file: `kms`).
 */
import { Driver } from "@stackra/container";
import { AwsKmsSignerDriver, Signer } from "@stackra/contracts";
import type { Signature, SignerPublicKey } from "@stackra/contracts";

import type { SignerConfig } from "#config/signer.config";
import type { KmsClient } from "#contracts/ports/kms-client.port";

/**
 * Signs inside AWS KMS.
 *
 * @example
 * const signer = new KmsSignerDriver(buildConfig(SignerConfig, { values: { kmsKeyId } }), kms);
 * const signature = await signer.sign(bytes);
 */
export class KmsSignerDriver extends Driver(Signer) {
  private readonly config: SignerConfig;

  private readonly kms: KmsClient;

  /** The contracts driver that does the signing, once built. */
  private delegate: AwsKmsSignerDriver | undefined;

  /**
   * @param config - the KMS key and the id signatures name.
   * @param kms - the KMS client the host binds.
   */
  constructor(config: SignerConfig, kms: KmsClient) {
    super();
    this.config = config;
    this.kms = kms;
  }

  /**
   * A detached ES256 signature of `message`.
   *
   * @throws RangeError when no KMS key is configured, or KMS refuses.
   */
  async sign(message: Uint8Array): Promise<Signature> {
    return this.signer().sign(message);
  }

  /**
   * The public key a verifier checks this signer's signatures with, read from KMS once.
   *
   * @throws RangeError when no KMS key is configured, or KMS refuses.
   */
  async publicKey(): Promise<SignerPublicKey> {
    return this.signer().publicKey();
  }

  /** The delegate over the configured key. */
  private signer(): AwsKmsSignerDriver {
    const { kmsKeyId, keyId } = this.config;
    this.delegate ??= new AwsKmsSignerDriver(this.kms, {
      kmsKeyId,
      ...(keyId === "" ? {} : { keyId }),
    });
    return this.delegate;
  }
}
