/**
 * Stackra file contract:
 * Purpose: `RegistrySettings`: the registry's settings.
 * Boundary: type only; the defaults live in wrangler.jsonc, never in code.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 19).
 */
import type { RetiredKey } from "#src/interfaces/retired-key.interface";

/** The registry's settings. */
export interface RegistrySettings {
  /** The public host, also the OIDC audience `npm:<host>`. */
  readonly host: string;
  /** (registry.maxTarballBytes) */
  readonly maxTarballBytes: number;
  /** The unpacked size a tarball may reach while it is checked. */
  readonly maxUnpackedBytes: number;
  /** (registry.publishTokenSeconds) */
  readonly publishTokenSeconds: number;
  /** (registry.tokenCacheSeconds) */
  readonly tokenCacheSeconds: number;
  /** (registry.licence.graceDays) */
  readonly licenceGraceDays: number;
  /** (registry.licence.maxTokens), read by the licence engine (stackra-183). */
  readonly licenceMaxTokens: number;
  readonly oidcIssuer: string;
  readonly oidcKeysSeconds: number;
  readonly openPackumentMaxAge: number;
  readonly catalogueMaxLimit: number;
  readonly licenceDocsUrl: string;
  /** The current signing key's `expires`, or null. */
  readonly signingKeyExpires: string | null;
  /** Rotated public keys that stay listed. */
  readonly retiredKeys: readonly RetiredKey[];
}
