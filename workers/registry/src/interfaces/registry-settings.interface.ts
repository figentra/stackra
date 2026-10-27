/**
 * Stackra file contract:
 * Purpose: `RegistrySettings`: the registry's settings.
 * Boundary: type only; the defaults live in wrangler.jsonc, never in code.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 19).
 */
import type { RetiredKey } from "#src/interfaces/retired-key.interface";

/** The registry's settings. */
export interface RegistrySettings {
  /** The public host, also the OIDC audience `npm:<host>`. */
  readonly host: string;
  /** The largest tarball, in bytes, a publish may upload (registry.maxTarballBytes). */
  readonly maxTarballBytes: number;
  /** The unpacked size a tarball may reach while it is checked. */
  readonly maxUnpackedBytes: number;
  /** How many seconds a publish token from the OIDC exchange stays valid (registry.publishTokenSeconds). */
  readonly publishTokenSeconds: number;
  /** How many seconds a licence token check stays cached at the edge (registry.tokenCacheSeconds). */
  readonly tokenCacheSeconds: number;
  /** How many days an expired licence still reads its packages (registry.licence.graceDays). */
  readonly licenceGraceDays: number;
  /** (registry.licence.maxTokens), read by the licence engine (stackra-183). */
  readonly licenceMaxTokens: number;
  /** The OIDC issuer the GitHub Actions ID token must come from. */
  readonly oidcIssuer: string;
  /** How many seconds the issuer's public keys stay cached. */
  readonly oidcKeysSeconds: number;
  /** The `max-age`, in seconds, of public responses: open packuments, the keys and the catalogue. */
  readonly openPackumentMaxAge: number;
  /** The largest page size a catalogue request may ask for. */
  readonly catalogueMaxLimit: number;
  /** The docs page that tells a user how to set up a licence token. */
  readonly licenceDocsUrl: string;
  /** The current signing key's `expires`, or null. */
  readonly signingKeyExpires: string | null;
  /** Rotated public keys that stay listed. */
  readonly retiredKeys: readonly RetiredKey[];
}
