/**
 * Stackra file contract:
 * Purpose: `CatalogueManifest`, the shape of one member's published `stackra.manifest.json` as a registry service
 *          reads it: the header and the four sections whose identities the catalogue checks.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads, so
 *           `validate(CatalogueManifest, raw)` works with no generated file. The section types are the ones
 *           `StackraManifest` declares, so a validated manifest reads like the committed file.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 22 and 26); ADR 0109 (decision 1); the contracts `StackraManifest` type.
 */
import type { StackraManifest } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { CATALOGUE_MANIFEST_SCHEMA } from "#core/constants/catalogue-manifest-schema.constant";

/**
 * One member's manifest, checked for structure.
 *
 * @example
 * const parsed = validate(CatalogueManifest, JSON.parse(body));
 * if (parsed.success) store(parsed.data.member, parsed.data);
 */
export class CatalogueManifest extends Schema {
  /** The member key (`commerce`). */
  member!: string;

  /** The package name (`@figentra/service-commerce`). */
  package!: string;

  /** The manifest format version. */
  version!: string;

  /** The member's modules with their dependencies. */
  modules: NonNullable<StackraManifest["modules"]> = [];

  /** The locked actions and queries. */
  actions: NonNullable<StackraManifest["actions"]> = [];

  /** The locked events, by wire name. */
  events: NonNullable<StackraManifest["events"]> = [];

  /** The derived permissions. */
  permissions: NonNullable<StackraManifest["permissions"]> = [];
}

registerSchemas([[CatalogueManifest, CATALOGUE_MANIFEST_SCHEMA]]);
