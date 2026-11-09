---
"@stackra/search": minor
"@stackra/privacy": minor
---

The search index registry and the privacy tables are tenant-owned in the platform form: a nullable `tenant_id`,
filled from `app.tenant_id` by default (a NULL row is the platform's), forced row-level security and the platform
policies. Cross-tenant readers go through audited system functions that return ids, owners and status columns only.

`@stackra/search` (migration `search.0010_contract_search_index_tenancy`): `search.indexes` backfills a row at a tenant
node (`nlevel(scope_path) = 3`) from its scope and keeps a row with no scope, at the root or at a product node, as a
platform row. A NULL scope key replaces the `-` of a platform-wide index under the key `(tenant_id, model, scope_key)`
(NULLs not distinct). `SearchIndexRegistry.list` (`search:status`) reads every tenant's indexes through
`search.index_statuses`, and `SearchIndexStatus` gains `ownerId`. `begin`, `progress` and `finish` change only the
call's own row.

Upgrade, search: the migration refuses, changing nothing, while an index registry row sits below a tenant node; delete
those rows (they hold only a rebuild's state and counts), migrate, then run `search:reindex` in each node's tenant.

`@stackra/privacy` (migration `privacy.0003_contract_privacy_tenancy`): `subject_salts`, `legal_holds` and
`legal_hold_refusals` copy their `scope_id` partition exactly into `tenant_id` (`-` becomes NULL) and drop its policy;
no driver or action reads or writes the `-` partition any more. A salt is keyed `(tenant_id, subject)` (NULLs not
distinct).

Breaking, privacy: `PostgresHoldRegistryDriver` takes the `Container` as its second argument and reads the
`CallIsolation` from it optionally. In a system run (no tenant, as `maintainPartitions` runs) it claims the live holds
of every tenant through `privacy.claim_live_holds`, then checks and logs each owner's holds in that owner; a claimed
hold that does not load throws `ClaimNotLoadedError` and a tenant's hold with no isolation bound throws
`RowIsolationMissingError` (both from `@stackra/outbox`): a held record is never let go by a skip. An app without
tenancy still boots; its platform holds run as before.

Rolling deploy: both migrations are expand steps, so the previous release keeps working beside this one for one
release.

- Search keeps a plain unique index on `(model, scope_key)` (NULLs distinct) for the previous release's
  `on conflict (model, scope_key)`, and `-` stays a valid key.
- Privacy keeps `scope_id` (now nullable, unused by this release). `privacy.fill_legacy_scope_id` fills it on insert
  from `tenant_id` (`-` for a platform row), and the salts' primary key becomes a unique index on
  `(scope_id, subject)`.

Later contract step, once no previous release runs:

- Search: set each remaining `-` key to NULL (deleting one whose owner already has a NULL row), then drop
  `idx_indexes_model_scope_key`.
- Privacy: drop the three `trg_*_legacy_scope_id` triggers, `privacy.fill_legacy_scope_id`,
  `idx_subject_salts_scope_id_subject` and the `scope_id` columns.
