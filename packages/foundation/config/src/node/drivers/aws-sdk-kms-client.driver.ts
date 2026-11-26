/**
 * Stackra file contract:
 * Purpose: the `aws-sdk` driver of the `KmsClient` port: the aggregated `KMS` client of `@aws-sdk/client-kms` in the
 *          configured region, built on first use, so `KmsSignerDriver` signs inside KMS with no host code.
 * Boundary: server only. `@aws-sdk/client-kms` is an optional peer, imported lazily: a host that never signs through
 *           KMS never loads it, and one that does installs it. No credential is configured: the SDK's default chain
 *           (the runtime's role) signs every call. A host that brings its own client binds its own `KmsClient` driver.
 * Runtime: node
 * Governing contract: ADR 0188 (decision 2); ADR 0416; ADR 0294 (decision 16); owner approval 2026-11-09 (the KMS
 *                     client in the catalog).
 */
import { Driver } from "@stackra/container";
import type { AwsKmsApi } from "@stackra/contracts";

import type { SignerConfig } from "#config/signer.config";
import { KmsClient } from "#contracts/ports/kms-client.port";

/**
 * Calls AWS KMS through the SDK.
 *
 * @example
 * const kms = new AwsSdkKmsClientDriver(buildConfig(SignerConfig, { values: { region: "me-central-1" } }));
 * const signer = new KmsSignerDriver(config, kms);
 */
export class AwsSdkKmsClientDriver extends Driver(KmsClient) {
  private readonly region: string;

  /** The SDK client, once imported and built. */
  private client: Promise<AwsKmsApi> | undefined;

  /**
   * @param config - the region; empty means the SDK's default.
   */
  constructor(config: SignerConfig) {
    super();
    this.region = config.region;
  }

  /** An ECDSA P-256 signature (DER) of a SHA-256 digest. */
  async sign(input: Parameters<AwsKmsApi["sign"]>[0]): ReturnType<AwsKmsApi["sign"]> {
    return (await this.kms()).sign(input);
  }

  /** The public half of an asymmetric key, as DER SubjectPublicKeyInfo. */
  async getPublicKey(
    input: Parameters<AwsKmsApi["getPublicKey"]>[0],
  ): ReturnType<AwsKmsApi["getPublicKey"]> {
    return (await this.kms()).getPublicKey(input);
  }

  /** Unwraps a data key wrapped under `KeyId` with the same encryption context. */
  async decrypt(input: Parameters<AwsKmsApi["decrypt"]>[0]): ReturnType<AwsKmsApi["decrypt"]> {
    return (await this.kms()).decrypt(input);
  }

  /** A fresh AES-256 data key, returned wrapped only. */
  async generateDataKeyWithoutPlaintext(
    input: Parameters<AwsKmsApi["generateDataKeyWithoutPlaintext"]>[0],
  ): ReturnType<AwsKmsApi["generateDataKeyWithoutPlaintext"]> {
    return (await this.kms()).generateDataKeyWithoutPlaintext(input);
  }

  /** The SDK client, imported and built on first use. */
  private kms(): Promise<AwsKmsApi> {
    this.client ??= import("@aws-sdk/client-kms").then(({ KMS }): AwsKmsApi => {
      const kms = new KMS(this.region === "" ? {} : { region: this.region });
      // The SDK types an absent field as `T | undefined`; the port leaves it out.
      return {
        sign: async (input) => {
          const { Signature } = await kms.sign(input);
          return Signature === undefined ? {} : { Signature };
        },
        getPublicKey: async (input) => {
          const { PublicKey } = await kms.getPublicKey(input);
          return PublicKey === undefined ? {} : { PublicKey };
        },
        decrypt: async (input) => {
          const { Plaintext } = await kms.decrypt(input);
          return Plaintext === undefined ? {} : { Plaintext };
        },
        generateDataKeyWithoutPlaintext: async (input) => {
          const { CiphertextBlob } = await kms.generateDataKeyWithoutPlaintext(input);
          return CiphertextBlob === undefined ? {} : { CiphertextBlob };
        },
      };
    });
    return this.client;
  }
}
