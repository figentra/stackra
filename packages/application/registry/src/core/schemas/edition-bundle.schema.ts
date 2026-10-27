/**
 * Stackra file contract:
 * Purpose: `EditionBundle`, what the registry records for an edition: its product key, the base product and version
 *          range it builds against, its own modules, the base modules it bundles, which install with it, and the range
 *          packs and role presets it seeds for a tenant that installs it.
 * Boundary: a shape class; registers this package's schema for itself when the module loads. The relation is written
 *           once in the edition's root runway (`product.edition`); this is the registry's copy of it, with the bundle.
 *           A base module the edition does not bundle is not available to its tenants.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decisions 2, 4, 5 and 6); ADR 0109 (as amended by ADR 0335); stackra-64 (packs and
 *                     role presets are data records, never code).
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
 *   packs: ["range:fashion-basics"],
 *   rolePresets: ["role-preset:stylist"],
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

  /** The range pack record keys the edition seeds (`range:fashion-basics`); absent when it seeds none. */
  packs?: string[];

  /** The role preset record keys the edition seeds (`role-preset:stylist`); absent when it seeds none. */
  rolePresets?: string[];
}

registerSchemas([[EditionBundle, EDITION_BUNDLE_SCHEMA]]);
