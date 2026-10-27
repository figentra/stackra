/**
 * Stackra file contract:
 * Purpose: the AWS KMS driver of the `KeyProvider` port (driver name `aws-kms`), one instance per tenant: it holds the
 *          tenant's wrapped data keys (oldest first, the last current), unwraps each through KMS the first time it is
 *          asked for, bound to the tenant and key id, and keeps the plaintext in memory for the life of the instance.
 * Boundary: a plain subclass of the port (this package sits below @stackra/container). Managed or bring your own: the
 *           KMS key is the environment's managed key or the tenant's own key ARN (a grant to the runtime role);
 *           either way the KMS client signs with the runtime's role and no credential is configured. Never lists
 *           keys, never logs or exports one. A key KMS refuses to unwrap (wrong tenant, destroyed key, revoked
 *           grant) rejects with a RangeError that names the key id only.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2: a KMS key per environment wraps a per-tenant data key; deleting a tenant
 *                     destroys its key); ADR 0173 (nobody reads a value); ADR 0415.
 */
import { base64urlDecode } from "#core/functions/base64url-decode.function";
import { kmsKeyContext } from "#core/functions/kms-key-context.function";
import { KeyProvider } from "#core/ports/key-provider.port";
import type { AwsKmsApi } from "#core/types/aws-kms-api.type";
import type { AwsKmsKeyProviderOptions } from "#core/types/aws-kms-key-provider-options.type";
import type { DataKey } from "#core/types/data-key.type";
import type { WrappedDataKey } from "#core/types/wrapped-data-key.type";

/** AES-256: 32 bytes. */
const KEY_BYTES = 32;

/** A key id that fits between the dots of a sealed form. */
const KEY_ID = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Serves one tenant's data keys, unwrapped through AWS KMS.
 *
 * @example
 * const keys = new AwsKmsKeyProviderDriver(new KMS({ region }), {
 *   kmsKeyId: config.kmsKeyId,
 *   scopeId: tenant.id,
 *   keys: tenant.dataKeys,
 * });
 * const cipher = new AesGcmFieldCipherDriver(keys);
 */
export class AwsKmsKeyProviderDriver extends KeyProvider {
  private readonly kms: AwsKmsApi;

  private readonly options: AwsKmsKeyProviderOptions;

  private readonly wrapped = new Map<string, string>();

  /** Unwraps in flight or done, by key id, so concurrent callers share one KMS call. */
  private readonly unwrapped = new Map<string, Promise<DataKey>>();

  /**
   * @param kms - the KMS client (the SDK's `KMS`, or any `AwsKmsApi`).
   * @param options - the KMS key, the tenant and its wrapped keys.
   * @throws RangeError when there is no key, the tenant or KMS key is empty, or a key id is malformed or repeats.
   */
  constructor(kms: AwsKmsApi, options: AwsKmsKeyProviderOptions) {
    super();
    if (options.kmsKeyId === "" || options.scopeId === "")
      throw new RangeError("AwsKmsKeyProviderDriver needs a KMS key id and a tenant id");
    for (const { id, wrapped } of options.keys) {
      if (!KEY_ID.test(id)) throw new RangeError(`A key id is 1 to 64 of [A-Za-z0-9_-], got ${id}`);
      if (this.wrapped.has(id)) throw new RangeError(`Key ${id} is given twice`);
      this.wrapped.set(id, wrapped);
    }
    if (options.keys.length === 0)
      throw new RangeError(`Tenant ${options.scopeId} has no wrapped data key`);
    this.kms = kms;
    this.options = options;
  }

  /** The key new data is sealed with. */
  current(): Promise<DataKey> {
    // The constructor refuses an empty list, so the last key exists.
    return this.byId((this.options.keys.at(-1) as WrappedDataKey).id);
  }

  /** The key with this id, for opening data sealed before a rotation. */
  byId(id: string): Promise<DataKey> {
    const held = this.unwrapped.get(id);
    if (held !== undefined) return held;
    const wrapped = this.wrapped.get(id);
    if (wrapped === undefined)
      return Promise.reject(new RangeError(`No data key has the id ${id}`));
    const pending = this.unwrap(id, wrapped);
    this.unwrapped.set(id, pending);
    // A failed unwrap is not cached: a restored grant works on the next call.
    pending.catch(() => this.unwrapped.delete(id));
    return pending;
  }

  /** One KMS `Decrypt` of key `id`. */
  private async unwrap(id: string, wrapped: string): Promise<DataKey> {
    let plaintext: Uint8Array | undefined;
    try {
      ({ Plaintext: plaintext } = await this.kms.decrypt({
        CiphertextBlob: base64urlDecode(wrapped),
        KeyId: this.options.kmsKeyId,
        EncryptionContext: kmsKeyContext(this.options.scopeId, id),
      }));
    } catch {
      throw new RangeError(`KMS refused to unwrap data key ${id}`);
    }
    if (plaintext?.length !== KEY_BYTES)
      throw new RangeError(`KMS returned no ${KEY_BYTES}-byte key for ${id}`);
    return Object.freeze({ id, key: new Uint8Array(plaintext) });
  }
}
