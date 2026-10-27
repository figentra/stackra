/**
 * Stackra file contract:
 * Purpose: `AwsKmsKeyProviderOptions`, what one tenant's `AwsKmsKeyProviderDriver` needs: the KMS key the data keys
 *          are wrapped under, the tenant, and the tenant's wrapped keys.
 * Boundary: a type only. The KMS key id is deployment configuration (the environment's managed key) or the tenant's
 *           own key ARN (bring your own key); the wrapped keys come from the tenant's row. Nothing here is secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0415.
 */
import type { WrappedDataKey } from "#core/types/wrapped-data-key.type";

/** One tenant's KMS key settings. */
export type AwsKmsKeyProviderOptions = {
  /** The KMS key id or ARN the data keys are wrapped under. */
  readonly kmsKeyId: string;
  /** The tenant the keys belong to; part of the encryption context. */
  readonly scopeId: string;
  /** The tenant's wrapped data keys, oldest first; the last is current. */
  readonly keys: readonly WrappedDataKey[];
};
