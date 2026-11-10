/**
 * Stackra file contract:
 * Purpose: `KmsKeyProviderDriver`, the `kms` driver of @stackra/contracts' `KeyProvider` (ADR 0188 decision 2,
 *          amendment 2026-11-09): one instance serves every tenant. It reads the running call's tenant, lists that
 *          tenant's wrapped keys from `TenantDataKeyStore`, mints the first one on the tenant's first seal (KMS
 *          `GenerateDataKeyWithoutPlaintext`), and unwraps each through the region's KMS key with the tenant and key id
 *          in the encryption context, so KMS refuses another tenant's key. `rotate()` adds the tenant's next key.
 * Boundary: a container driver over `TenantKeysConfig`, the bound `KmsClient` (@stackra/config, the SDK loaded on first
 *           use) and `TenantDataKeyStore`; it delegates unwrapping to contracts' `AwsKmsKeyProviderDriver`, one per
 *           tenant, held in a `TenantKeyCache` bounded by `cacheSeconds` and `cacheTenants`. The tenant is the call's
 *           (`withTenant`), never input; a platform call is refused. Ids `k1`, `k2`, …: `current()` is the newest,
 *           `byId()` opens every older one, and none is retired while the tenant exists. Never logs, lists or exports a
 *           key; a refusal names the key id only.
 * Runtime: node
 * Governing contract: ADR 0188 (decision 2 and its 2026-11-09 amendment); ADR 0173 (nobody reads a value); ADR 0415.
 */
import type { KmsClient } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";
import { AwsKmsKeyProviderDriver, KeyProvider, kmsKeyContext } from "@stackra/contracts";
import type { DataKey, PublicId } from "@stackra/contracts";

import type { TenantKeysConfig } from "#config/tenant-keys.config";
import type { TenantDataKeyStore } from "#contracts/ports/tenant-data-key-store.port";
import { TenantKeyCache } from "#core/values/tenant-key-cache.value";
import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";

/**
 * Every tenant's data keys, wrapped by the region's KMS key.
 * @example
 * const keys = new KmsKeyProviderDriver(config, kms, store);
 * await tenancy.withTenant(actor, async () => cipher(await keys.current()));
 */
export class KmsKeyProviderDriver extends Driver(KeyProvider) {
  /** The KMS key and the cache bounds. */
  private readonly config: TenantKeysConfig;

  /** The KMS client the host binds. */
  private readonly kms: KmsClient;

  /** Where each tenant's wrapped keys live. */
  private readonly store: TenantDataKeyStore;

  /** Each tenant's unwrapping delegate, once built. */
  private cache: TenantKeyCache<AwsKmsKeyProviderDriver> | undefined;

  /**
   * @param config - the region's KMS key and the cache bounds.
   * @param kms - the KMS client the host binds.
   * @param store - where each tenant's wrapped keys live.
   */
  constructor(config: TenantKeysConfig, kms: KmsClient, store: TenantDataKeyStore) {
    super();
    this.config = config;
    this.kms = kms;
    this.store = store;
  }

  /**
   * The running tenant's newest key, minted on its first seal.
   * @throws RangeError for a platform call, an empty `kmsKeyId`, or a key KMS refuses to mint or unwrap.
   */
  async current(): Promise<DataKey> {
    return (await this.keysOf(this.tenant())).current();
  }

  /**
   * The running tenant's key `id`, for data sealed before a rotation.
   * @throws RangeError for a platform call, an id the tenant has no key for, or a key KMS refuses to unwrap.
   */
  async byId(id: string): Promise<DataKey> {
    return (await this.keysOf(this.tenant())).byId(id);
  }

  /**
   * Adds the running tenant's next key and makes it current; every older key keeps opening its data.
   * @throws RangeError for a platform call, an empty `kmsKeyId`, or a key KMS refuses to mint.
   */
  async rotate(): Promise<DataKey> {
    const tenant = this.tenant();
    const held = await this.store.list(tenant);
    await this.mint(tenant, held.length + 1);
    this.caches().forget(tenant);
    return this.current();
  }

  /** The running call's tenant. */
  private tenant(): PublicId<"scp"> {
    const tenant = ACTIVE_TENANT.getStore();
    if (tenant === undefined)
      throw new RangeError(
        "A tenant data key needs a tenant call (withTenant); a platform call has none",
      );
    return tenant;
  }

  /** The cache, built on first use from the configured bounds. */
  private caches(): TenantKeyCache<AwsKmsKeyProviderDriver> {
    this.cache ??= new TenantKeyCache(this.config.cacheSeconds, this.config.cacheTenants);
    return this.cache;
  }

  /** The tenant's unwrapping delegate, from the cache or built over its stored keys. */
  private keysOf(tenant: PublicId<"scp">): Promise<AwsKmsKeyProviderDriver> {
    return this.caches().get(tenant, async () => {
      let keys = await this.store.list(tenant);
      if (keys.length === 0) {
        await this.mint(tenant, 1);
        keys = await this.store.list(tenant);
      }
      return new AwsKmsKeyProviderDriver(this.kms, {
        kmsKeyId: this.kmsKeyId(),
        scopeId: tenant,
        keys,
      });
    });
  }

  /** Mints the tenant's key `k<version>` and stores it wrapped; a concurrent mint of the same version keeps the first. */
  private async mint(tenant: PublicId<"scp">, version: number): Promise<void> {
    const id = `k${version}`;
    const keyId = this.kmsKeyId();
    let blob: Uint8Array | undefined;
    try {
      ({ CiphertextBlob: blob } = await this.kms.generateDataKeyWithoutPlaintext({
        KeyId: keyId,
        KeySpec: "AES_256",
        EncryptionContext: kmsKeyContext(tenant, id),
      }));
    } catch {
      throw new RangeError(`KMS refused to mint data key ${id}`);
    }
    if (blob === undefined || blob.length === 0)
      throw new RangeError(`KMS returned no wrapped key for ${id}`);
    await this.store.add(tenant, { id, wrapped: Buffer.from(blob).toString("base64url") });
  }

  /** The configured KMS key; refused while empty. */
  private kmsKeyId(): string {
    if (this.config.kmsKeyId === "")
      throw new RangeError(
        "TenantKeysConfig.kmsKeyId is empty: the kms driver has no KMS key to wrap with",
      );
    return this.config.kmsKeyId;
  }
}
