/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/model, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339). The old `./traits` and `./orm` entries are folded in (owner Q4).
 * Boundary: names each re-export and declares nothing. `Collection` and `Ref` are the ORM's own, so
 *           `new Collection<T>(this)` in a model is the collection the hydrator and the unit of work understand. The
 *           trait registry, `MinorUnitsType`, the public id minting and the kind list stay internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { Collection } from "@mikro-orm/core";
export type { Ref } from "@mikro-orm/core";
export { Model } from "#core/bases/model.base";
export { Index } from "#core/decorators/index.decorator";
export { ManyToMany } from "#core/decorators/many-to-many.decorator";
export { ManyToOne } from "#core/decorators/many-to-one.decorator";
export { OneToMany } from "#core/decorators/one-to-many.decorator";
export { Searchable } from "#core/decorators/searchable.decorator";
export { OnDelete } from "#core/enums/on-delete.enum";
export { createTrait } from "#core/functions/create-trait.function";
export { traitsOf } from "#core/functions/traits-of.function";
export { LinkType } from "#core/orm/link.type";
export { MoneySchema } from "#core/orm/money.schema";
export { TranslatedType } from "#core/orm/translated.type";
export { AppendOnly } from "#core/traits/append-only.trait";
export { BelongsToTenant } from "#core/traits/belongs-to-tenant.trait";
export { HasPublicId } from "#core/traits/has-public-id.trait";
export { SoftDeletes } from "#core/traits/soft-deletes.trait";
export { Timestamps } from "#core/traits/timestamps.trait";
export { Translatable } from "#core/traits/translatable.trait";
export { UserStamps } from "#core/traits/user-stamps.trait";
export { Versioned } from "#core/traits/versioned.trait";
export type { Attributes } from "#core/types/attributes.type";
export type { IndexDefinition } from "#core/types/index-definition.type";
export type { IndexOptions } from "#core/types/index-options.type";
export type { ManyToManyOptions } from "#core/types/many-to-many-options.type";
export type { ManyToOneOptions } from "#core/types/many-to-one-options.type";
export type { ModelClass } from "#core/types/model-class.type";
export type { OneToManyOptions } from "#core/types/one-to-many-options.type";
export type { RelationDefinition } from "#core/types/relation-definition.type";
export type { RelationSource } from "#core/types/relation-source.type";
export type { SearchableOptions } from "#core/types/searchable-options.type";
export type { Trait } from "#core/types/trait.type";
export type { TraitRecord } from "#core/types/trait-record.type";
export { Link } from "#core/values/link.value";
export { Translated } from "#core/values/translated.value";
