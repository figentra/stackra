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

| Import           | Holds                     | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/model` | `src/core/`: node runtime | `Model`, traits (`HasPublicId`, `Timestamps`, `UserStamps`, `Versioned`, `SoftDeletes`, `Archivable`, `Partitioned`, `Retention`, `AppendOnly`, `HasCorrections`, `Commentable`, `HasAttachments`, `Taggable`, `HasTree`, `Translatable`, `HasEncryptedFields`), `currentRows`, `Model.global`, `ModelAddition`, `DataClass`, `PrivilegedDataClass`, `CredentialDataClass`, `Classify`, `DocumentNumber`, `AiAudience`, `SupportAccess`, `SearchSnippet`, `ExportLabel`, `Meter`, `createTrait`, `traitsOf`, `SYSTEM_FIELDS`, `SystemField`, `systemFieldsOf`, `ValidateOnFlush`, `publicIdToUuid`, `uuidToPublicId`, `PublicIdType`, `encryptedFieldsOf`, `encryptedSubjectOf`, `EncryptedFieldsSubscriber`, `SubjectCipherResolver`, `EncryptedFieldsOptions`, `EncryptedFieldsResealService`, `KeyUsage`, `ResealOptions`, `ResealStep`, `encryptedLookupOf`, `encryptedScopeOf`, `whereEncrypted`, `Index`, `Searchable`, `Visibility`, `ManyToOne`, `OneToOne`, `OneToMany`, `ManyToMany`, `OnDelete`, `Collection`, `Ref`, `Link`, `Translated`, `Attributes`, `LinkType`, `TranslatedType`, `MoneySchema`, `CapturesChanges`, `changeCaptureOf`, `Cached`, `CachedOptions`, `cacheTtlOf` |

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

| Trait                                                         | Adds                                              | Notes                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `HasPublicId(prefix)`                                         | `id: PublicId<prefix>`, minted on create (UUIDv7) | Prefix 2 to 6 lowercase letters (ADR 0135)                                      |
| `Timestamps`                                                  | `createdAt`, `updatedAt`                          | `updatedAt` moves on every changing flush                                       |
| `UserStamps`                                                  | `createdBy`, `updatedBy` (principal public ids)   | Filled from the actor, never from input                                         |
| `Versioned`                                                   | `version` (starts at 1)                           | Optimistic concurrency; a stale write is a `conflict`                           |
| `SoftDeletes`                                                 | `deletedAt`                                       | Delete policy `soft`; reads hide deleted rows (`deleted`)                       |
| `Archivable`                                                  | `archivedAt`                                      | Delete policy `archive`; reads hide archived rows (`archived`)                  |
| `Partitioned({ by, interval })`                               | nothing (marker with options)                     | Range-partitioned by time; see @stackra/database                                |
| `AppendOnly`                                                  | nothing                                           | Marker read by `traitsOf`; updates are refused                                  |
| `HasCorrections`                                              | `corrects` (the corrected row's id)               | With `AppendOnly`; `currentRows` keeps the latest correction                    |
| `Commentable`                                                 | nothing                                           | Marker; comments live in the collaboration service                              |
| `HasAttachments`                                              | nothing                                           | Marker; attached files live in the files service                                |
| `Taggable`                                                    | `tags` (tag keys)                                 | Keys from the tenant's tag list; GIN index to filter                            |
| `HasTree`                                                     | `parentId`, `treePath` (`ltree`)                  | Hierarchy; path kept by @stackra/database, `t.tree()` (GiST)                    |
| `Translatable(fields)`                                        | nothing                                           | Names the model's `Translated` fields (jsonb, `.in(locale)`)                    |
| `HasEncryptedFields([{ subject, lookup, scope },] ...fields)` | nothing                                           | Names string fields that rest sealed; see below                                 |
| `CapturesChanges({ values })`                                 | nothing (marker with options)                     | Row changes enter the outbox change feed; see @stackra/outbox                   |
| `Retention({ keep, basis, policy })`                          | nothing (marker with options)                     | Expired rows archived, soft- or hard-deleted by `data_maintenance.record.prune` |
| `Cached({ ttl })`                                             | nothing (marker with options)                     | Reads by id served from the shared entity cache; see @stackra/database          |
| `ValidateOnFlush`                                             | nothing                                           | Each written row is checked against `X$` at flush; see below                    |

Ownership by a tenant is not a model trait: `BelongsToTenant` is `@stackra/tenancy/node`'s (ADR 0321, ADR 0323
decision 3), built with `createTrait`, as in the example above. `createTrait(name, apply, options)` makes a trait for
another package, and `traitsOf(Model)` lists a model's traits with their options. `Model.with` refuses a trait applied
twice.

### System fields

`SYSTEM_FIELDS` lists, by trait, the fields the system writes: `id` (`HasPublicId`), `createdAt`/`updatedAt`
(`Timestamps`), `createdBy`/`updatedBy` (`UserStamps`), `deletedAt` (`SoftDeletes`), `archivedAt` (`Archivable`),
`version` (`Versioned`) and `treePath` (`HasTree`). `systemFieldsOf(Model)` reads them for one model from its traits, so a model's own `version`
field is not one unless it is `Versioned`. `SystemField` is the union of the names, for an input type that leaves them
out. @stackra/database's `CrudService` refuses a write that sets one (`system_field_write`), except the id of a new
row.

`ValidateOnFlush` opts a model in to a schema check at flush: @stackra/database's `ValidateOnFlushSubscriber` encodes
each created or changed row through the model's generated `X$` and refuses the flush (`model_invalid`) when it fails,
so a service write cannot store what the action input would have refused.

## Encrypted fields

`HasEncryptedFields("email", "phone")` names string fields that rest encrypted (gap R-36). The table holds only their
sealed form; the model holds plain text. `EncryptedFieldsSubscriber`, built with the `FieldCipher` port of
`@stackra/contracts`, seals them before a create, an update (only the fields it writes) or an upsert, gives the plain
text back after the write, and opens them on load. Each value is bound to the context `<model key>.<field>`
(`crm.customer_contact.email`), so it opens only in its own column; a null stays null. Pass the subscriber in
`DatabaseOptions.subscribers`; the generated boot does it once gen registers it (STA-339). Writes that bypass the unit
of work (`nativeInsert`, `nativeUpdate`, the query builder, raw SQL) are not sealed, and an encrypted field cannot be
searched, sorted or indexed by value. `encryptedFieldsOf(Model)` lists the fields.

### Sealed per subject (crypto-shredding)

`HasEncryptedFields({ subject: "userId" }, "email", "phone")` seals each row under the key of the data subject its
`userId` names, so erasing that subject (`ErasureMethod.Shred` of `@stackra/privacy`, which destroys the subject's salt)
makes the fields unreadable everywhere, backups included. The subscriber takes a second argument, the
`SubjectCipherResolver` port (`@stackra/privacy` ships `SaltedSubjectCipherResolverDriver`): `sealing(subject)` creates
the subject's salt on the first seal, `opening(subject)` answers undefined once it is gone, and the field then loads as
null, so type it `string | null`. A row whose subject property holds no id, or a subject-sealed model with no resolver
bound, is refused rather than sealed under the scope's key. An update that changes the subject seals every loaded
encrypted field again. `encryptedSubjectOf(Model)` reads the subject property.

### Bound to the owning scope

`HasEncryptedFields({ scope: "tenantId" }, "content")` binds each value to the scope that owns its row as well as to
its column: the context is `<model key>.<field>@<scope id>` (`ai.message.content@scp_…`), the id read from the
row's `tenantId` (ADR 0476, gap gov8). A sealed value copied into another scope's row then does not open, even under
a key both scopes can reach. Use it on every scope-owned model whose encrypted value must never move between scopes;
`@stackra/ai`'s `Message` does, and replaces the retired `ScopeKeyCast`. A row whose scope property holds no id is
refused, and an update that changes it seals every field again. It combines with `subject` and `lookup`; a blind
index stays bound to `<model key>.<field>` (it is under the scope's key already), so `whereEncrypted` needs no row.
`encryptedScopeOf(Model)` reads the scope property. Adding `scope` to a model that already has sealed
rows changes their context, so those rows no longer open; no job moves them (ADR 0476).

### Looking up an encrypted field (blind index)

An encrypted field cannot be compared in SQL, so a field you look up by equal value (login, dedupe) keeps a blind
index (gap gov9): `HasEncryptedFields({ lookup: ["email"] }, "email", "phone")`. The model declares the index property
itself, `emailBidx: string | null = null` (column `email_bidx`, indexed); gen adds the column and index check. On each
seal the subscriber writes `<field>Bidx`, an HMAC-SHA-256 of the plain text bound to `<model key>.<field>` under a key
derived from the scope's current data key (`<keyId>.<hex>`), and nulls it with the field. Build the subscriber with
the scope's `KeyProvider` as its third argument; without it, or without the declared property, a write is refused.

```ts
const leads = await em.find(
  Lead,
  await whereEncrypted(em, keys, Lead, "email", "hala@example.com"),
);
```

Exact equality only: normalise the value (case, spaces) the same way before writing and before looking up. The
ciphertext stays randomised (unlike a deterministic cipher); the index reveals only which rows share a value. After a
key rotation a row matches again once `EncryptedFieldsResealService` has re-sealed it, which also backfills the index
of rows written before the field kept one. `lookup` cannot be combined with `subject`: an index under the scope's key
would still match an erased subject's value.

### Key rotation: re-seal and key usage

Every sealed value names the data key that sealed it, so a rotated key still opens old rows. `EncryptedFieldsResealService`
finishes a rotation (gap gov7). Build it with the scope's `FieldCipher`, its `KeyProvider` and, for subject-sealed
models, the `SubjectCipherResolver`:

```ts
const job = new EncryptedFieldsResealService(cipher, keys, subjects);
await job.usage(em, Contact); // { current: "k2", rows: 1200, keys: { k1: 310, k2: 1890 }, stale: 300 }
let after = ledger.cursor; // resume where a stopped run was
do ({ cursor: after } = await job.reseal(em, Contact, { after, limit: 500 }));
while (after !== null);
```

`usage` counts the sealed values under each key and the rows still holding one off the current key; once every
model reports no value under an old key, that key can be retired. `reseal` reads one page of raw rows in primary-key
order (soft-deleted and archived rows too), opens each value off the current key and seals it again in the same
`<model key>.<field>` context, and writes the row only if it still holds what was read, so a concurrent write wins
and the row is counted `skipped` (a later run takes it). A row of an erased subject is skipped too. Run both inside
the scope's transaction (row-level security), store the returned `cursor` (the import-ledger pattern) and stop when
it is null. A model needs a single-column primary key.

`CapturesChanges({ values?, exclude? })` puts every committed change of the model's rows into @stackra/outbox's
retained change feed, consumed or not. With `values: true` a change carries the written fields' `before` and `after`
values; `changeCaptureOf(Model)` gives `{ values, dropped }`, where `dropped` joins `exclude`, the `HasEncryptedFields`
fields and every `@Classified` field, whose values never enter a change.

## Relations

| Field type      | Decorator                                       | Stored as                                         |
| --------------- | ----------------------------------------------- | ------------------------------------------------- |
| `Ref<T>`        | `@ManyToOne(() => T, { onDelete })`             | a foreign key `fk_<table>_<column>`, indexed      |
| `Link<T>`       | `@ManyToOne(() => T)` (T in another module)     | an indexed `<name>_id` column (`LinkType`), no FK |
| `Collection<T>` | `@OneToMany(() => T, (t) => t.parent, options)` | the children's foreign key                        |
| `Collection<T>` | `@ManyToMany(() => T, { pivotTable })`          | a pivot table in the module's schema              |
| `Ref<T>`        | `@OneToOne(() => T, { onDelete })`              | the owning side's foreign key, unique             |
| `Ref<T>`        | `@OneToOne(() => T, (t) => t.owner)`            | nothing: the inverse side of a one-to-one         |

`link.id` needs no load; `link.load()` runs the owning module's generated read through the resolver the generated
wiring installs with `Link.useResolver`. `Link.loadMany(links)` loads many at once, DataLoader-style: one read per
target model by id set through the batch resolver the wiring installs with `Link.useBatchResolver` (or one `load()` per
distinct id without one); `GraphQuery` uses it. Decorators record metadata only (`ManyToOne.members(Model)` reads it back),
and tsc refuses a relation decorator on a field of the wrong type.

## Facets

`@Index(properties, { unique, where })` declares one index (several per model, `Index.on(Model)` in source order);
`@Searchable({ text, filters, sortable, ranges, boost, when, semantic })` declares the hybrid search index
(`Searchable.on(Model)`): `sortable` and `ranges` name the number or date fields a search may sort by or bound,
`boost` gives a text field its weight letter (`A` to `D`) over its position, and `when` lists the values a field must
hold for a row to be searchable (`{ status: ["active"] }`). Gen names the
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
