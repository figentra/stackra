/**
 * Stackra file contract:
 * Purpose: `EditionBundle`, what the registry records for an edition: its product key, the base product and version
 *          range it builds against, its own modules, and the base modules it bundles, which install with it.
 * Boundary: a shape class; registers this package's schema for itself when the module loads. The relation is written
 *           once in the edition's root runway (`product.edition`); this is the registry's copy of it, with the bundle.
 *           A base module the edition does not bundle is not available to its tenants.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decisions 2, 5 and 6); ADR 0109 (as amended by ADR 0335).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { EDITION_BUNDLE_SCHEMA } from "#core/constants/edition-bundle-schema.constant";

/**
 * One edition's bundle.
 *
 * @example
 * validate(EditionBundle, {
 *   product: "fashion",
 *   edition: { of: "commerce", version: "^1.0.0" },
 *   modules: ["fashion_sizes"],
 *   bundles: ["catalog", "orders"],
 * });
 */
export class EditionBundle extends Schema {
  /** The edition's product key. */
  product!: string;

  /** The base product key and the base version range. */
  edition!: { of: string; version: string };

  /** The edition's own module keys. */
  modules!: string[];

  /** The base module keys bundled with it. */
  bundles!: string[];
}

registerSchemas([[EditionBundle, EDITION_BUNDLE_SCHEMA]]);
