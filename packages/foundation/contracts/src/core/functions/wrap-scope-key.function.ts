/**
 * Stackra file contract:
 * Purpose: `wrapScopeKey`, a new tenant data key from AWS KMS, returned wrapped only: what tenant provisioning and a
 *          key rotation store beside the tenant before `AwsKmsKeyProviderDriver` serves it.
 * Boundary: one `GenerateDataKeyWithoutPlaintext` call under the KMS key the caller names (the environment's managed
 *           key, or a tenant's own key ARN when it brings one), bound to the tenant and key id by the encryption
 *           context. The plaintext never exists here. Refuses a malformed key id or an empty KMS answer with a
 *           RangeError.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0415 (decisions 1 and 2).
 */
import { base64urlEncode } from "#core/functions/base64url-encode.function";
import { kmsKeyContext } from "#core/functions/kms-key-context.function";
import type { AwsKmsApi } from "#core/types/aws-kms-api.type";
import type { WrappedDataKey } from "#core/types/wrapped-data-key.type";

/** A key id that fits between the dots of a sealed form. */
const KEY_ID = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * A fresh data key `keyId` for `scopeId`, wrapped under `kmsKeyId`.
 *
 * @example
 * const next = await wrapScopeKey(new KMS({ region }), config.kmsKeyId, tenant.id, "k2");
 * await tenants.addDataKey(tenant.id, next);
 */
export async function wrapScopeKey(
  kms: AwsKmsApi,
  kmsKeyId: string,
  scopeId: string,
  keyId: string,
): Promise<WrappedDataKey> {
  if (!KEY_ID.test(keyId))
    throw new RangeError(`A key id is 1 to 64 of [A-Za-z0-9_-], got ${keyId}`);
  const { CiphertextBlob } = await kms.generateDataKeyWithoutPlaintext({
    KeyId: kmsKeyId,
    KeySpec: "AES_256",
    EncryptionContext: kmsKeyContext(scopeId, keyId),
  });
  if (CiphertextBlob === undefined || CiphertextBlob.length === 0)
    throw new RangeError(`KMS returned no wrapped key for ${keyId}`);
  return Object.freeze({ id: keyId, wrapped: base64urlEncode(CiphertextBlob) });
}
