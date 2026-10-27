/**
 * Stackra file contract:
 * Purpose: `C2paManifestDefinition`, the part of a c2pa-rs `ManifestDefinition` this package writes: the claim
 *          generator, the image format and the `c2pa.actions.v2` assertion.
 * Boundary: a type only; field names are c2pa-rs's JSON names. It is a type alias with mutable arrays so it is
 *           assignable to c2pa-node 0.9.10's `Manifest` (which `Builder.withJson` takes and which carries a string
 *           index signature an interface cannot meet).
 * Runtime: isomorphic
 * Governing contract: C2PA 2.x; COM-73, COM-294; STA-789.
 */

/** A C2PA manifest definition as c2pa-rs reads it. */
export type C2paManifestDefinition = {
  /** The tool that made the claim. */
  readonly claim_generator_info: { readonly name: string }[];
  /** The image's media type. */
  readonly format: string;
  /** The assertions the claim makes. */
  readonly assertions: {
    readonly label: string;
    readonly data: { readonly actions: readonly Readonly<Record<string, unknown>>[] };
  }[];
};
