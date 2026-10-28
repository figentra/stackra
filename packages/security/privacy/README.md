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
- The key is shredded only when no held row carries a `shred` field: shredding would destroy what the hold keeps.
  The receipt's `shredded` says which.
- The last step records `SubjectErased` (`privacy.subject.erased.v1`) and, with `ackAs`, the workflow's
  `ServiceAcked` with the same `kept`, so a cross-service erasure gathers every service's receipt.
- Erasure has no undo.

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
| `./contracts` | `ErasureReceipt`, `ErasedRecords`, `SubjectExport`, `SubjectExportSection`, `SubjectRecord`, `PersonalDataOptions` | types                                                                  |
| `./node`      | `EraseSubjectWorkflow`, `EraseSubjectAction`                                                                       | the erasure saga and the job that starts it                            |
| `./node`      | `ExportSubjectDataAction`, `PurgeSubjectExportsAction`                                                             | the DSAR export job and the nightly export purge                       |
| `./node`      | `RepositoryPersonalDataStoreDriver`, `PrivacyModule`                                                               | the database store driver; the root module                             |
| `./node`      | `SubjectPermissions` (`erase` L4, `export` L1), `SubjectExportPermissions` (`purge` L4)                            | the jobs' system permissions, held by no role                          |
| `./node`      | `EraseSubjectInput/Output`, `ExportSubjectDataInput/Output`, `PurgeSubjectExportsInput/Output`                     | schemas                                                                |
| `./testing`   | `SubjectSaltStoreFake`, `clearPersonalData`                                                                        | a recording salt store; empties the declaration registry between tests |

## What a host wires

- A `SubjectSaltStore` driver from its key service: the store of the salts `SubjectKeyProviderDriver`
  (`@stackra/contracts`) derives subject keys from. Only `destroy` is called.
- A `FileSystem` disk that can sign URLs (S3, R2, GCS); the local disk cannot.
- A `HoldRegistry` through `connectHoldRegistry` (`@stackra/database`); with none, nothing is held.

## Not here yet

- `Retention({ model, keep, basis })` and the shared prune job (the P1 row of the gap analysis).
- `useDataRequests`, a request inbox UI and the identity check of the requester; the request flow is the host's.
- The locked model key in receipts: until gen exposes locked model keys (STA-339), `kind` is the module key given to `registerPersonalData` and the model's class name in snake_case (`crm.customer`).
