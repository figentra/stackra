/**
 * Stackra file contract:
 * Purpose: `C2paManifestDefinition`, the part of a c2pa-rs `ManifestDefinition` this package writes: the claim
 *          generator, the image format and the `c2pa.actions.v2` assertion.
 * Boundary: a type only; field names are c2pa-rs's JSON names.
 * Runtime: isomorphic
 * Governing contract: C2PA 2.x; COM-73, COM-294; STA-789.
 */

/** A C2PA manifest definition as c2pa-rs reads it. */
export interface C2paManifestDefinition {
  /** The tool that made the claim. */
  readonly claim_generator_info: readonly { readonly name: string }[];
  /** The image's media type. */
  readonly format: string;
  /** The assertions the claim makes. */
  readonly assertions: readonly {
    readonly label: string;
    readonly data: { readonly actions: readonly Readonly<Record<string, unknown>>[] };
  }[];
}
