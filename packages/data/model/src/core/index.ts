/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/model, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339). The old `./traits` and `./orm` entries are folded in (owner Q4).
 * Boundary: names each re-export and declares nothing. `Collection` and `Ref` are the ORM's own, so
 *           `new Collection<T>(this)` in a model is the collection the hydrator and the unit of work understand. The
 *           trait registry, the global-model set, `MinorUnitsType` and the kind list stay internal;
 *           public ids are minted by @stackra/contracts' `mintPublicId` (STA-1380).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { Collection } from "@mikro-orm/core";
export type { Ref } from "@mikro-orm/core";
export { PrivilegedDataClass } from "#core/access/privileged.data-class";
export { DataClass } from "#core/bases/data-class.base";
export { Model } from "#core/bases/model.base";
export { ModelAddition } from "#core/bases/model-addition.base";
export { Classify } from "#core/decorators/classify.decorator";
export { DocumentNumber } from "#core/decorators/document-number.decorator";
export { Index } from "#core/decorators/index.decorator";
export { ManyToMany } from "#core/decorators/many-to-many.decorator";
export { ManyToOne } from "#core/decorators/many-to-one.decorator";
export { OneToOne } from "#core/decorators/one-to-one.decorator";
export { Meter } from "#core/decorators/meter.decorator";
export { OneToMany } from "#core/decorators/one-to-many.decorator";
export { Searchable } from "#core/decorators/searchable.decorator";
export { Visibility } from "#core/decorators/visibility.decorator";
export { AiAudience } from "#core/enums/ai-audience.enum";
export { ExportLabel } from "#core/enums/export-label.enum";
export { OnDelete } from "#core/enums/on-delete.enum";
export { SearchSnippet } from "#core/enums/search-snippet.enum";
export { SupportAccess } from "#core/enums/support-access.enum";
export { createTrait } from "#core/functions/create-trait.function";
export { changeCaptureOf } from "#core/functions/change-capture-of.function";
export { currentRows } from "#core/functions/current-rows.function";
export { encryptedFieldsOf } from "#core/functions/encrypted-fields-of.function";
export { encryptedSubjectOf } from "#core/functions/encrypted-subject-of.function";
export { traitsOf } from "#core/functions/traits-of.function";
export { publicIdToUuid } from "#core/functions/public-id-to-uuid.function";
export { uuidToPublicId } from "#core/functions/uuid-to-public-id.function";
export { EncryptedFieldsSubscriber } from "#core/orm/encrypted-fields.subscriber";
export { LinkType } from "#core/orm/link.type";
export { PublicIdType } from "#core/orm/public-id.type";
export { MoneySchema } from "#core/orm/money.schema";
export { TranslatedType } from "#core/orm/translated.type";
export { SubjectCipherResolver } from "#core/ports/subject-cipher-resolver.port";
export { AppendOnly } from "#core/traits/append-only.trait";
export { CapturesChanges } from "#core/traits/captures-changes.trait";
export { Commentable } from "#core/traits/commentable.trait";
export { HasAttachments } from "#core/traits/has-attachments.trait";
export { HasCorrections } from "#core/traits/has-corrections.trait";
export { HasEncryptedFields } from "#core/traits/has-encrypted-fields.trait";
export { HasPublicId } from "#core/traits/has-public-id.trait";
export { SoftDeletes } from "#core/traits/soft-deletes.trait";
export { Archivable } from "#core/traits/archivable.trait";
export { Partitioned } from "#core/traits/partitioned.trait";
export { Taggable } from "#core/traits/taggable.trait";
export { Timestamps } from "#core/traits/timestamps.trait";
export { Translatable } from "#core/traits/translatable.trait";
export { UserStamps } from "#core/traits/user-stamps.trait";
export { Versioned } from "#core/traits/versioned.trait";
export type { Attributes } from "#core/types/attributes.type";
export type { CapturesChangesOptions } from "#core/types/captures-changes-options.type";
export type { ChangeCapture } from "#core/types/change-capture.type";
export type { DataClassOptions } from "#core/types/data-class-options.type";
export type { DataClassRef } from "#core/types/data-class-ref.type";
export type { PartitionedOptions } from "#core/types/partitioned-options.type";
export type { DocumentNumberOptions } from "#core/types/document-number-options.type";
export type { EncryptedFieldsOptions } from "#core/types/encrypted-fields-options.type";
export type { IndexDefinition } from "#core/types/index-definition.type";
export type { IndexOptions } from "#core/types/index-options.type";
export type { ManyToManyOptions } from "#core/types/many-to-many-options.type";
export type { ManyToOneOptions } from "#core/types/many-to-one-options.type";
export type { MeterOptions } from "#core/types/meter-options.type";
export type { ModelClass } from "#core/types/model-class.type";
export type { OneToManyOptions } from "#core/types/one-to-many-options.type";
export type { RelationDefinition } from "#core/types/relation-definition.type";
export type { RelationSource } from "#core/types/relation-source.type";
export type { SearchableOptions } from "#core/types/searchable-options.type";
export type { Trait } from "#core/types/trait.type";
export type { TraitRecord } from "#core/types/trait-record.type";
export type { VisibilityOptions } from "#core/types/visibility-options.type";
export { Link } from "#core/values/link.value";
export { Translated } from "#core/values/translated.value";
