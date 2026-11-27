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
  /**
   * The public host an answer names in tarball and attestation URLs, the realm and the browse pages: REGISTRY_HOST as
   * read, and per request the served host the request came in on (`answerHost`), so metadata fetched on an alias host
   * points back at that host.
   */
  readonly host: string;
  /** Every host the Worker answers on, REGISTRY_HOST (the main host) first, then REGISTRY_ALIAS_HOSTS. */
  readonly hosts: readonly string[];
  /** The OIDC audiences a publish token exchange accepts; `npm:<host>` for each of `hosts` unless set. */
  readonly oidcAudiences: readonly string[];
  /** While true, every request but a read answers 503 (REGISTRY_READ_ONLY, a data move). */
  readonly readOnly: boolean;
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
