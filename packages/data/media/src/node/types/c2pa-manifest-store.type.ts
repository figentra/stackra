/**
 * Stackra file contract:
 * Purpose: `C2paManifestStore`, the part of a c2pa-rs manifest store (`Reader#json()`) a credential is read from: the
 *          active manifest, its generator, assertions and signature time, and the validation outcome.
 * Boundary: a type only; field names are c2pa-rs's JSON names. Unknown fields are ignored.
 * Runtime: isomorphic
 * Governing contract: C2PA 2.x; COM-73, COM-294; STA-789.
 */

/** The part of a manifest a credential is read from. */
interface C2paManifest {
  readonly claim_generator?: string;
  readonly claim_generator_info?: readonly { readonly name?: string }[];
  readonly assertions?: readonly { readonly label?: string; readonly data?: unknown }[];
  readonly signature_info?: { readonly time?: string };
}

/** The part of a manifest store this package reads. */
export interface C2paManifestStore {
  /** The label of the manifest that describes the asset. */
  readonly active_manifest?: string;
  /** Every manifest, by label. */
  readonly manifests?: Readonly<Record<string, C2paManifest>>;
  /** `Valid`, `Trusted` or `Invalid` (c2pa-rs 0.4x and later). */
  readonly validation_state?: string;
  /** The validation failures (older c2pa-rs). */
  readonly validation_status?: readonly unknown[];
}
