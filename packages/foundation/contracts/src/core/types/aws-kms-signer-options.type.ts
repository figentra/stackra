/**
 * Stackra file contract:
 * Purpose: `AwsKmsSignerOptions`, what `AwsKmsSignerDriver` needs: the asymmetric KMS key (`ECC_NIST_P256`,
 *          `SIGN_VERIFY`) and the id signatures name it by.
 * Boundary: a type only; deployment configuration (the environment's managed signing key, or a tenant's own key ARN
 *           when it brings one). Nothing here is secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3); ADR 0416.
 */

/** One KMS signing key. */
export type AwsKmsSignerOptions = {
  /** The KMS key id, ARN or alias. */
  readonly kmsKeyId: string;
  /** The id written into each signature; the KMS key id when left out. */
  readonly keyId?: string;
};
