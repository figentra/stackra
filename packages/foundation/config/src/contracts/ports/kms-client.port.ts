/**
 * Stackra file contract:
 * Purpose: the `KmsClient` port: the AWS KMS calls a KMS-backed driver makes (`sign`, `getPublicKey`, `decrypt`,
 *          `generateDataKeyWithoutPlaintext`), so `KmsSignerDriver` takes its client from the container.
 * Boundary: an abstract class that is its own token, shaped as @stackra/contracts' `AwsKmsApi`, so the aggregated `KMS`
 *           client of `@aws-sdk/client-kms` fits a driver as it is. This package takes no SDK dependency: the host binds
 *           a driver that wraps `new KMS({ region })` with the runtime's role (no credential in config).
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0416; ADR 0294 (decisions 16 and 17).
 */
import { type AwsKmsApi, Port } from "@stackra/contracts";

/** The AWS KMS client the KMS drivers call. */
export abstract class KmsClient extends Port implements AwsKmsApi {
  /** An ECDSA P-256 signature (DER) of a SHA-256 digest. */
  abstract sign(input: Parameters<AwsKmsApi["sign"]>[0]): ReturnType<AwsKmsApi["sign"]>;

  /** The public half of an asymmetric key, as DER SubjectPublicKeyInfo. */
  abstract getPublicKey(
    input: Parameters<AwsKmsApi["getPublicKey"]>[0],
  ): ReturnType<AwsKmsApi["getPublicKey"]>;

  /** Unwraps a data key wrapped under `KeyId` with the same encryption context. */
  abstract decrypt(input: Parameters<AwsKmsApi["decrypt"]>[0]): ReturnType<AwsKmsApi["decrypt"]>;

  /** A fresh AES-256 data key, returned wrapped only. */
  abstract generateDataKeyWithoutPlaintext(
    input: Parameters<AwsKmsApi["generateDataKeyWithoutPlaintext"]>[0],
  ): ReturnType<AwsKmsApi["generateDataKeyWithoutPlaintext"]>;
}
