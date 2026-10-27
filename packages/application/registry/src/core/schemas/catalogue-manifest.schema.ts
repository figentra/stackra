/**
 * Stackra file contract:
 * Purpose: `CatalogueManifest`, the shape of one member's published `stackra.manifest.json` as a registry service
 *          reads it: the header and the four sections whose identities the catalogue checks, with the catalogue fields
 *          a registry stores (module `enhances`, `intents`, `entitlement`; action `tool`; event `webhook`,
 *          `dataClasses`, `thinFields`).
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads, so
 *           `validate(CatalogueManifest, raw)` works with no generated file. The section types are the ones
 *           `StackraManifest` declares, so a validated manifest reads like the committed file.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 22 and 26); ADR 0109 (decision 1); the contracts `StackraManifest` type;
 *                     ADR 0360 (decision 4); ADR 0134; ADR 0224; OS ADR 0037 d1.
 */
import type { DataClassification, StackraManifest } from "@stackra/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";

import { CATALOGUE_MANIFEST_SCHEMA } from "#core/constants/catalogue-manifest-schema.constant";

/**
 * One member's manifest, checked for structure.
 *
 * @example
 * const parsed = validate(CatalogueManifest, JSON.parse(body));
 * if (parsed.success) store(parsed.data.member, parsed.data);
 */
export class CatalogueManifest extends Schema {
  /** The member's modules with their dependencies, the modules they only enhance, assistant intents and entitlement. */
  // reason: a manifest entry typed by `StackraManifest` from @stackra/contracts, which ships no schema for it; the shipped
  // schema already says its rule and keeps the fields gen adds later (loose)
  @Field(CATALOGUE_MANIFEST_SCHEMA.shape.modules)
  modules: (NonNullable<StackraManifest["modules"]>[number] & {
    /** Modules this one adds to without needing them. */
    readonly enhances?: readonly string[];
    /** The assistant intents the module serves. */
    readonly intents?: readonly string[];
    /** The entitlement key that sells the module; absent when it is free. */
    readonly entitlement?: string;
  })[] = [];

  /** The locked actions and queries; `tool` is set when an agent may call one. */
  // reason: a manifest entry typed by `StackraManifest` from @stackra/contracts, which ships no schema for it; the shipped
  // schema already says its rule and keeps the fields gen adds later (loose)
  @Field(CATALOGUE_MANIFEST_SCHEMA.shape.actions)
  actions: (NonNullable<StackraManifest["actions"]>[number] & {
    /** The agent tool gen derived (`{ name, default, hints }`), or `true` in a hand-written manifest. */
    readonly tool?: boolean | { readonly name: string; readonly [field: string]: unknown };
    /** Why a user-facing action is not a tool. */
    readonly toolOff?: string;
  })[] = [];

  /** The locked events, by wire name, with their webhook opt-in and personal-data classes. */
  // reason: a manifest entry typed by `StackraManifest` from @stackra/contracts, which ships no schema for it; the shipped
  // schema already says its rule and keeps the fields gen adds later (loose)
  @Field(CATALOGUE_MANIFEST_SCHEMA.shape.events)
  events: (NonNullable<StackraManifest["events"]>[number] & {
    /** Whether tenants may subscribe a webhook endpoint to it. */
    readonly webhook?: boolean;
    /** The personal-data classes its payload carries; any makes its webhook payload thin. */
    readonly dataClasses?: readonly DataClassification[];
    /** For a thin payload, the non-id fields kept. */
    readonly thinFields?: readonly string[];
  })[] = [];

  /** The derived permissions. */
  // reason: a manifest entry typed by `StackraManifest` from @stackra/contracts, which ships no schema for it; the shipped
  // schema already says its rule and keeps the fields gen adds later (loose)
  @Field(CATALOGUE_MANIFEST_SCHEMA.shape.permissions)
  permissions: NonNullable<StackraManifest["permissions"]> = [];

  /** The member key (`commerce`). */
  member!: string;

  /** The package name (`@figentra/service-commerce`). */
  package!: string;

  /** The manifest format version. */
  version!: string;
}

registerSchemas([[CatalogueManifest, CATALOGUE_MANIFEST_SCHEMA]]);
