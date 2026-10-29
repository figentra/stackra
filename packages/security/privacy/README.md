<!-- Purpose: the reader's guide to @stackra/privacy: what it is for, how a module declares its personal data, how a host runs a DSAR export and an erasure, and what each entry exports. Boundary: documentation of this package only; the decisions live in the ADRs it cites. Runtime: none. Governing contract: ADR 0189 (decisions 1, 2 and 4), ADR 0212, ADR 0134, STA-1375. -->

# @stackra/privacy

Data-subject rights for PDPL (Saudi Arabia) and GDPR: a person may ask for every record a product holds about them
(access and portability, GDPR Art. 15 and 20, PDPL Art. 4) and ask to be erased (GDPR Art. 17, PDPL destruction).
Each module **declares** its personal data with the `PersonalData` kind; this package does the rest: the DSAR export
job writes a zip behind a signed, expiring link (ADR 0189 decision 1), and the erasure saga over `@stackra/workflow`
crypto-shreds the subject key, deletes or anonymises the remaining rows, keeps whatever a legal hold covers and issues
a receipt (ADR 0189 decisions 2 and 4).

**Tier:** `tier:lib` (`packages/security/privacy`). Entries `.`, `./contracts`, `./node` and `./testing`. Depends on
`@stackra/actions`, `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/data-transfer` (the zip
writer), `@stackra/database` (holds and repositories), `@stackra/events`, `@stackra/filesystem` (the export disk),
`@stackra/iam` (the job permissions), `@stackra/queue` and `@stackra/scheduler` (imported by gen's generated
registrations of the erase and export jobs, so declared for them: `generated_dependency_missing`), `@stackra/validation`
and `@stackra/workflow`.

## Use

```ts
// the model: a shredded field is sealed under the key of the subject the declaration names (stackra-263)
export class Customer extends Model.with(
  HasPublicId("cus"),
  HasEncryptedFields({ subject: "userId" }, "name", "email"),
) {
  userId!: string;
  name!: string | null; // reads as null once the subject is erased
  email!: string | null;
  phone!: string | null;
}

// a module's privacy/customer.personal-data.ts: data only, no exporter or eraser to write
export class CustomerPersonalData extends PersonalData({
  model: () => Customer,
  subject: "userId", // the property holding the subject's public id
  fields: {
    name: ErasureMethod.Shred, // sealed under the subject key; erasure destroys the key's salt
    email: ErasureMethod.Shred,
    phone: ErasureMethod.Anonymise, // set to null; the row stays
  },
}) {}
registerPersonalData("crm", [CustomerPersonalData]); // shortcut until gen registers privacy/ groups (STA-339)

// the host's request flow, after verifying the person
const { url, expiresAt } = await pipeline.execute(
  ExportSubjectDataAction,
  { subject },
  { actor: system },
);
const receipt = await pipeline.execute(
  EraseSubjectAction,
  { erasureId, subject },
  { actor: system },
);

// a host's config override: same name, package class aliased
import { PrivacyConfig as BasePrivacyConfig } from "@stackra/privacy";
export class PrivacyConfig extends BasePrivacyConfig {
  override exportTtlDays = 3;
}
```

### Erasure rules

- A row with any `delete` field is deleted; a row with `anonymise` fields only has them set to null; `shred` fields
  change nothing in the row and become unreadable when the subject key's salt is destroyed.
- Before anything is touched, the saga asks the `HoldRegistry` (`disposableIds`, as `delete` or `edit`). Held rows
  are kept and counted in the receipt's `kept` (`reason: "hold"`).
- After the rows, `redact` nulls every field the declarations name (`email`, `phone`, ...) in each outbox message
  still held (due, retrying or dead-lettered) whose payload names the subject's public id, so a late delivery or a
  dead-letter replay carries none of it. The receipt counts them as `{ kind: "outbox.message", method: "anonymise" }`.
- After `SubjectErased`, `UnindexErasedSubjectListener` removes the subject's remaining rows (shredded or held) from
  the search index and, for a semantic model, the vector index (`SearchForgetService` of `@stackra/search/node`).
  Deleted and anonymised rows leave or are re-indexed through the search change consumers already.
- The key is shredded only when no held row carries a `shred` field: shredding would destroy what the hold keeps.
  The receipt's `shredded` says which.
- The last step records `SubjectErased` (`privacy.subject.erased.v1`) and, with `ackAs`, the workflow's
  `ServiceAcked` with the same `kept`, so a cross-service erasure gathers every service's receipt.
- Erasure has no undo.
- A `shred` field must be a `HasEncryptedFields({ subject })` field of its model, keyed by the declaration's own
  `subject` property (`unsealedShredFields`). Otherwise the saga refuses before touching any row: destroying the salt
  would leave the field readable under the scope's key, and the receipt would be false.

### Export rules

- Every registered model is searched, empty ones too; only declared fields are copied.
- The zip holds `manifest.json` and one `data/<Model>.json` per declaration, under a random name in
  `PrivacyConfig.exportFolder`, so neither the path nor the link names the subject.
- The link lives `exportTtlDays` (7 by default, 1 to 30). `PurgeSubjectExportsAction` deletes older zips nightly.

## What is here

| Entry         | Symbol                                                                                                             | Use                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `.`           | `PersonalData`, `registerPersonalData`, `personalDataDeclarations`                                                 | the kind, its registration and the resolved declarations               |
| `.`           | `SubjectExportService`                                                                                             | `collect(subject, at)` and `archive(export)`                           |
| `.`           | `PrivacyConfig`, `PrivacyOptions`, `PrivacyConfig$`                                                                | `store` (`repository`, `memory`), `exportTtlDays` (7), `exportFolder`  |
| `.`           | `MemoryPersonalDataStoreDriver`, `MemorySubjectSaltStoreDriver`                                                    | memory drivers for tests and previews; seed them with `put`            |
| `.`           | `SubjectErased`, `ErasedRecordsLine`, `PERSONAL_DATA_STORE_DRIVERS`                                                | the receipt event and its line shape; the store driver names           |
| `./contracts` | `ErasureMethod`, `PersonalDataStore`, `SubjectSaltStore`                                                           | the enum and the ports                                                 |
| `./contracts` | `SubjectHolds`                                                                                                     | is a subject held; account deletion defers on it (STA-1567)            |
| `./contracts` | `ErasureReceipt`, `ErasedRecords`, `SubjectExport`, `SubjectExportSection`, `SubjectRecord`, `PersonalDataOptions` | types                                                                  |
| `./node`      | `EraseSubjectWorkflow`, `EraseSubjectAction`                                                                       | the erasure saga and the job that starts it                            |
| `./node`      | `UnindexErasedSubjectListener`                                                                                     | removes an erased subject's remaining rows from search                 |
| `./node`      | `ExportSubjectDataAction`, `PurgeSubjectExportsAction`                                                             | the DSAR export job and the nightly export purge                       |
| `./node`      | `RepositoryPersonalDataStoreDriver`, `PrivacyModule`                                                               | the database store driver; the root module                             |
| `./node`      | `SubjectPermissions` (`erase` L4, `export` L1), `SubjectExportPermissions` (`purge` L4)                            | the jobs' system permissions, held by no role                          |
| `./node`      | `PostgresSubjectSaltStoreDriver`, `CreateSubjectSaltsMigration`                                                    | the salt store over `privacy.subject_salts`, partitioned per tenant    |
| `./node`      | `PostgresSubjectHoldsDriver`                                                                                       | `SubjectHolds` over `privacy.legal_holds`, in the session's tenant     |
| `./node`      | `SaltedSubjectCipherResolverDriver`, `unsealedShredFields`                                                         | per-subject ciphers for `EncryptedFieldsSubscriber`; the shred check   |
| `./node`      | `PostgresHoldRegistryDriver`, `CreateLegalHoldsMigration`                                                          | the `HoldRegistry` over `privacy.legal_holds`, for a product off OS    |
| `./node`      | `PlaceHoldAction`, `ReleaseHoldAction`, `ListHoldsQuery` (and their `Input/Output` schemas)                        | place, release and list legal holds in the session's tenant            |
| `./contracts` | `LegalHold`                                                                                                        | one listed hold                                                        |
| `./node`      | `EraseSubjectInput/Output`, `ExportSubjectDataInput/Output`, `PurgeSubjectExportsInput/Output`                     | schemas                                                                |
| `./testing`   | `SubjectSaltStoreFake`, `clearPersonalData`                                                                        | a recording salt store; empties the declaration registry between tests |

## What a host wires

- A `SubjectSaltStore` driver: `PostgresSubjectSaltStoreDriver` (over the `Database`) or its own key service's. It
  holds the salts `SubjectKeyProviderDriver` (`@stackra/contracts`) derives subject keys from: `obtain` on a subject's
  first seal, `find` on each open, `destroy` on erasure. The table is partitioned by `app.tenant_id` (`-` outside a
  tenant), so a person who is a subject in two tenants has a salt in each and is erased per tenant. Deleting the row
  does not reach backups; ADR 0188 decision 3 caps how long they live.
- `SaltedSubjectCipherResolverDriver(keys, salts)` passed as the second argument of `EncryptedFieldsSubscriber`
  (`@stackra/model`), with the scope's `KeyProvider`, so subject-sealed models are sealed per subject.
- A `FileSystem` disk that can sign URLs (S3, R2, GCS); the local disk cannot.
- A `HoldRegistry` through `connectHoldRegistry` (`@stackra/database`); with none, nothing is held. Inside Figentra
  OS it is `ServiceHoldRegistryDriver` over the compliance service; a product outside OS binds
  `PostgresHoldRegistryDriver` (over the `Database`) and runs `CreateLegalHoldsMigration`.

## Legal holds outside Figentra OS

`privacy.legal_holds` is a product's own hold store, partitioned by `app.tenant_id` (`-` outside a tenant) like the
salts. `PlaceHoldAction` (`privacy.hold.place@1`, `{ model, recordId, reason }`) holds one record of a model, or, with a
subject's public id, every record whose subject links (`registerHoldLinks`) name it; it answers `{ holdId }` (`lgh_`).
`ReleaseHoldAction` (`privacy.hold.release@1`, `{ holdId, reason }`) releases a live hold and keeps its row as evidence.
`ListHoldsQuery` (`privacy.hold.list@1`) lists live holds, or all with `includeReleased`, optionally for one
`recordId`. All three are for users and services with their derived permissions; none is an agent tool.
`PostgresHoldRegistryDriver` answers `heldAmong` from the live holds and logs each refused disposal to
`privacy.legal_hold_refusals`.

## Not here yet

- `Retention({ model, keep, basis })` and the shared prune job (the P1 row of the gap analysis).
- `useDataRequests`, a request inbox UI and the identity check of the requester; the request flow is the host's.
- The locked model key in receipts: until gen exposes locked model keys (STA-339), `kind` is the module key given to `registerPersonalData` and the model's class name in snake_case (`crm.customer`).
