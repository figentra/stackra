/**
 * Stackra file contract:
 * Purpose: `RegistryDeps`: the registry's dependencies.
 * Boundary: type only.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453.
 */
import type { LicenceCheck } from "#src/access/licence-check.port";
import type { KeySource } from "#src/interfaces/key-source.type";
import type { KvNamespace } from "#src/interfaces/kv-namespace.interface";
import type { R2Bucket } from "#src/interfaces/r2-bucket.interface";
import type { RegistrySettings } from "#src/interfaces/registry-settings.interface";
import type { Signer } from "#src/interfaces/signer.interface";
import type { RegistryStore } from "#src/store/registry-store";

/** The registry's dependencies. */
export interface RegistryDeps {
  readonly store: RegistryStore;
  readonly tarballs: R2Bucket;
  readonly cache: KvNamespace;
  readonly licences: LicenceCheck;
  readonly signer: Signer;
  readonly oidcKeys: KeySource;
  readonly settings: RegistrySettings;
  now(): Date;
  /** Runs work after the response (the Worker's `ctx.waitUntil`). */
  defer(task: Promise<unknown>): void;
}
