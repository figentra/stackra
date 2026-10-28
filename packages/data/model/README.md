# @stackra/model

<!--
Stackra file contract:
Purpose: the reader-facing guide of @stackra/model: the model kind, traits, relations, facets, data classes and ORM types.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0294; ADR 0305; ADR 0221; ADR 0341; ADR 0380 (`semantic` and the `ai: never` floor).
-->

The model kind of the programming model v3.1: `Model.with(...traits)`, the eight model traits, relations (`Ref<T>`
and `Collection<T>` inside a module, `Link<T>` across modules), the `@Index`, `@Searchable` and `@Visibility` facets,
and the ORM column types and `Money` embeddable that gen's generated entity metadata imports.

**Tier:** `tier:lib` (`packages/data/model`), entry `.` only (the old `./traits` and `./orm` entries are folded in).
Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/events`, `@stackra/money` and
`@mikro-orm/core`. Server only: an app or a client never imports a model (ADR 0227: no ORM on a client).

## Entry points

| Import           | Holds                     | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/model` | `src/core/`: node runtime | `Model`, traits (`HasPublicId`, `Timestamps`, `UserStamps`, `Versioned`, `SoftDeletes`, `Archivable`, `Partitioned`, `AppendOnly`, `HasCorrections`, `Commentable`, `HasAttachments`, `Taggable`, `Translatable`, `HasEncryptedFields`), `currentRows`, `Model.global`, `ModelAddition`, `DataClass`, `PrivilegedDataClass`, `Classify`, `DocumentNumber`, `AiAudience`, `SupportAccess`, `SearchSnippet`, `ExportLabel`, `Meter`, `createTrait`, `traitsOf`, `publicIdToUuid`, `uuidToPublicId`, `PublicIdType`, `encryptedFieldsOf`, `EncryptedFieldsSubscriber`, `Index`, `Searchable`, `Visibility`, `ManyToOne`, `OneToMany`, `ManyToMany`, `OnDelete`, `Collection`, `Ref`, `Link`, `Translated`, `Attributes`, `LinkType`, `TranslatedType`, `MoneySchema` |

Entry barrels are generated, never authored (ADR 0294 decision 15); until `stackra gen` writes them (STA-339),
`src/core/index.ts` is a stand-in barrel.

## A model

```ts
import { Collection, HasPublicId, Index, Model, OneToMany, Timestamps } from "@stackra/model";
import type { Money } from "@stackra/money";
import { BelongsToTenant } from "@stackra/tenancy/node";

@Index(["status", "createdAt"])
export class Order extends Model.with(HasPublicId("ord"), BelongsToTenant, Timestamps) {
  status: OrderStatus = OrderStatus.PendingPayment;

  total!: Money; // columns total_minor (bigint) and total_currency (char(3))

  @OneToMany(() => OrderLine, (line) => line.order, { orphanRemoval: true })
  lines = new Collection<OrderLine>(this);
}

order.record(OrderPlaced.create({ orderId: order.id })); // kept beside the instance until commit
```

- The field type is the column and wire type, the initializer the default, `| null` nullable (ADR 0294 decision 4).
- No constructor-made state: the ORM loads a row without running the constructor. Build models with `em.create`,
  factories or `CrudService`, never `new` (decision 27). A model that narrows a trait field writes `declare`.
- `record(event)` stores the event in @stackra/events beside the instance; the unit of work takes it at commit.

## Traits

| Trait                           | Adds                                              | Notes                                                          |
| ------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| `HasPublicId(prefix)`           | `id: PublicId<prefix>`, minted on create (UUIDv7) | Prefix 2 to 6 lowercase letters (ADR 0135)                     |
| `Timestamps`                    | `createdAt`, `updatedAt`                          | `updatedAt` moves on every changing flush                      |
| `UserStamps`                    | `createdBy`, `updatedBy` (principal public ids)   | Filled from the actor, never from input                        |
| `Versioned`                     | `version` (starts at 1)                           | Optimistic concurrency; a stale write is a `conflict`          |
| `SoftDeletes`                   | `deletedAt`                                       | Delete policy `soft`; reads hide deleted rows (`deleted`)      |
| `Archivable`                    | `archivedAt`                                      | Delete policy `archive`; reads hide archived rows (`archived`) |
| `Partitioned({ by, interval })` | nothing (marker with options)                     | Range-partitioned by time; see @stackra/database               |
| `AppendOnly`                    | nothing                                           | Marker read by `traitsOf`; updates are refused                 |
| `HasCorrections`                | `corrects` (the corrected row's id)               | With `AppendOnly`; `currentRows` keeps the latest correction   |
| `Commentable`                   | nothing                                           | Marker; comments live in the collaboration service             |
| `HasAttachments`                | nothing                                           | Marker; attached files live in the files service               |
| `Taggable`                      | `tags` (tag keys)                                 | Keys from the tenant's tag list; GIN index to filter           |
| `Translatable(fields)`          | nothing                                           | Names the model's `Translated` fields (jsonb, `.in(locale)`)   |
| `HasEncryptedFields(...fields)` | nothing                                           | Names string fields that rest sealed; see below                |

Ownership by a tenant is not a model trait: `BelongsToTenant` is `@stackra/tenancy/node`'s (ADR 0321, ADR 0323
decision 3), built with `createTrait`, as in the example above. `createTrait(name, apply, options)` makes a trait for
another package, and `traitsOf(Model)` lists a model's traits with their options. `Model.with` refuses a trait applied
twice.

## Encrypted fields

`HasEncryptedFields("email", "phone")` names string fields that rest encrypted (gap R-36). The table holds only their
sealed form; the model holds plain text. `EncryptedFieldsSubscriber`, built with the `FieldCipher` port of
`@stackra/contracts`, seals them before a create, an update (only the fields it writes) or an upsert, gives the plain
text back after the write, and opens them on load. Each value is bound to the context `<model key>.<field>`
(`crm.customer_contact.email`), so it opens only in its own column; a null stays null. Pass the subscriber in
`DatabaseOptions.subscribers`; the generated boot does it once gen registers it (STA-339). Writes that bypass the unit
of work (`nativeInsert`, `nativeUpdate`, the query builder, raw SQL) are not sealed, and an encrypted field cannot be
searched, sorted or indexed by value. `encryptedFieldsOf(Model)` lists the fields.

## Relations

| Field type      | Decorator                                       | Stored as                                         |
| --------------- | ----------------------------------------------- | ------------------------------------------------- |
| `Ref<T>`        | `@ManyToOne(() => T, { onDelete })`             | a foreign key `fk_<table>_<column>`, indexed      |
| `Link<T>`       | `@ManyToOne(() => T)` (T in another module)     | an indexed `<name>_id` column (`LinkType`), no FK |
| `Collection<T>` | `@OneToMany(() => T, (t) => t.parent, options)` | the children's foreign key                        |
| `Collection<T>` | `@ManyToMany(() => T, { pivotTable })`          | a pivot table in the module's schema              |

`link.id` needs no load; `link.load()` runs the owning module's generated read through the resolver the generated
wiring installs with `Link.useResolver`. Decorators record metadata only (`ManyToOne.members(Model)` reads it back),
and tsc refuses a relation decorator on a field of the wrong type.

## Facets

`@Index(properties, { unique, where })` declares one index (several per model, `Index.on(Model)` in source order);
`@Searchable({ text, filters, semantic })` declares the hybrid search index (`Searchable.on(Model)`). Gen names the
indexes (`idx_<table>_<columns>`) and checks every path. `semantic: true` also embeds the text fields through
@stackra/search's `Embedder` into its vector index; a text field whose data class says `ai: never` is then refused, by
gen (`searchable_semantic_ai_never`) and again by search at index time (ADR 0380).

`@Visibility({ attributes, follows })` declares that the model's records are visible by rule (ADR 0333):
`attributes` are the fields a visibility rule may test (`record.<attribute>`; index each one, since every read carries
the predicate), and `follows` names many-to-one relations whose record must be visible too (a document under a
matter). The facet only declares: `@stackra/iam`'s decision point evaluates the rules and its `./node` driver of
`@stackra/database`'s `VisibilityFilter` pushes them into reads, on top of row-level security (`Visibility.on(Model)`).

```ts
@Visibility({ attributes: ["collection", "status"] })
@Index(["collection"])
export class Product extends Model.with(HasPublicId("prd"), BelongsToTenant) {}
```

## Global models, additions, data classes and meters

```ts
export class Statute extends Model.global(HasPublicId("stt")) {} // no tenant_id (ADR 0210 amendment)

export class ProductAddition extends ModelAddition(Product) {
  fit!: string;
} // an edition's side table (ADR 0336)

export class AdviceNote extends Model.with(HasPublicId("adv")) {
  @Classify(PrivilegedDataClass) // ai: tenant_opt_in, support: hidden, search: no_snippet, export: labelled (ADR 0341)
  body!: string;
}

@Meter({ key: "matters.active", kind: MeterKind.Count }) // MeterKind from @stackra/contracts; usage.recorded.v1 via the outbox
export class Matter extends Model.with(HasPublicId("mat")) {}
```

A product declares its own class with `class X extends DataClass({ key, ai, support, search, export }) {}` in its
module's `access/<name>.data-class.ts`.

## Factories

`Attributes<M>` is what a factory's `definition` returns: any subset of the data fields, where a `Ref<T>` also takes a
`RelationSource<T>` (a factory declaring the `~builds` brand), a `Link<T>` the target's public id, and a `Translated`
field its plain locale map.

## Generated entity metadata

Gen writes MikroORM `EntitySchema` metadata per module into `.stackra/gen/entities/<module>.ts` and imports
`LinkType`, `TranslatedType` and `MoneySchema` from here. `MoneySchema`'s amount column refuses a value beyond
`Number.MAX_SAFE_INTEGER`.

Public ids are stored as native `uuid` (ADR 0135, 2026-10-28 amendment) once a member compiles its migrations with
`publicIds: "uuid"`: the key is `{ type: new PublicIdType("ord") }` and a link `new LinkType("catalogue.variant",
"var")`. The codec (`publicIdToUuid`, `uuidToPublicId`) drops the prefix on write and adds it on read, so models,
inputs and outputs only ever hold `ord_01jab3k4…`.

## Tests

`pnpm turbo run test --filter=@stackra/model`. Tests sit in `__tests__/` beside each subject (ADR 0022) and import the
runner from `@stackra/testing` (ADR 0269).

## Document numbers

```ts
export class Invoice extends Model.with(HasPublicId("inv")) {
  @DocumentNumber({ sequence: "invoice" }) // billing.invoice, a Sequence in database/sequences/
  number: string | null = null;
}
```

`@DocumentNumber` marks a legal document number taken from a gapless `Sequence` at commit (ADR 0342). It records
metadata only; gen refuses a field whose sequence is declared neither in the member nor in a dependency
(`document_number_unsequenced`), and the migration compiler refuses a Postgres `SEQUENCE`, so a document number is never
a counter column.
