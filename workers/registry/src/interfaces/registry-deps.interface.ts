/**
 * Stackra file contract:
 * Purpose: `RegistryDeps`: the registry's dependencies.
 * Boundary: type only.
 * Runtime: worker
 * Governing contract: ADR 0453.
 */
import type { LicenceCheck } from "#src/access/licence-check.port";
import type { KeySource } from "#src/interfaces/key-source.type";
import type { KvNamespace } from "#src/interfaces/kv-namespace.interface";
import type { LicenceStore } from "#src/licence/licence-store";
import type { R2Bucket } from "#src/interfaces/r2-bucket.interface";
import type { RegistrySettings } from "#src/interfaces/registry-settings.interface";
import type { Signer } from "#src/interfaces/signer.interface";
import type { RegistryStore } from "#src/store/registry-store";

/** The registry's dependencies. */
export interface RegistryDeps {
  /** The D1-backed store of scopes, packages, versions and tokens. */
  readonly store: RegistryStore;
  /** The D1 access of the licence API (licences, grants, tokens, issuer tokens, receipts). */
  readonly licenceStore: LicenceStore;
  /** The R2 bucket that holds the tarballs and attestation bundles. */
  readonly tarballs: R2Bucket;
  /** The KV namespace that caches rendered packuments. */
  readonly cache: KvNamespace;
  /** The check that turns a licence token into the licence behind it. */
  readonly licences: LicenceCheck;
  /** The signer of published versions and the source of `/-/npm/v1/keys`. */
  readonly signer: Signer;
  /** The source of the OIDC issuer's public keys. */
  readonly oidcKeys: KeySource;
  /** The registry's settings, read from its vars. */
  readonly settings: RegistrySettings;
  /** Returns the current time; tests pass a fixed clock. */
  now: () => Date;
  /** Runs work after the response (the Worker's `ctx.waitUntil`). */
  defer: (task: Promise<unknown>) => void;
}
