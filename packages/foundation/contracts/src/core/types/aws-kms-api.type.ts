/**
 * Stackra file contract:
 * Purpose: `AwsKmsApi`, the four AWS KMS calls the KMS drivers make (`decrypt`, `generateDataKeyWithoutPlaintext`,
 *          `sign`, `getPublicKey`), typed so the aggregated `KMS` client of `@aws-sdk/client-kms` fits it as it is.
 * Boundary: a type only. This package takes no SDK dependency: the host constructs `new KMS({ region })` with the
 *           runtime's role (no credential in config) and hands it to the driver, or any object with these four
 *           methods (a test fake, another KMS behind the same shape). Inputs and outputs carry only what the drivers
 *           read.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2: a KMS key per environment wraps per-tenant data keys); ADR 0415; ADR 0416.
 */

/** The AWS KMS calls the drivers use. */
export type AwsKmsApi = {
  /** Unwraps a data key wrapped under `KeyId` with the same encryption context. */
  decrypt(input: {
    CiphertextBlob: Uint8Array;
    KeyId?: string;
    EncryptionContext?: Record<string, string>;
  }): Promise<{ Plaintext?: Uint8Array }>;

  /** A fresh AES-256 data key, returned wrapped only. */
  generateDataKeyWithoutPlaintext(input: {
    KeyId: string;
    KeySpec: "AES_256";
    EncryptionContext?: Record<string, string>;
  }): Promise<{ CiphertextBlob?: Uint8Array }>;

  /** An ECDSA P-256 signature (DER) of a SHA-256 digest. */
  sign(input: {
    KeyId: string;
    Message: Uint8Array;
    MessageType: "DIGEST";
    SigningAlgorithm: "ECDSA_SHA_256";
  }): Promise<{ Signature?: Uint8Array }>;

  /** The public half of an asymmetric key, as DER SubjectPublicKeyInfo. */
  getPublicKey(input: { KeyId: string }): Promise<{ PublicKey?: Uint8Array }>;
};
