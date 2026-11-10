# @stackra/settings

## 0.33.0

### Patch Changes

- 628b60d: The scope-pathed models of these packages opt into `MovesWithScope`, so their rows follow a moved scope subtree (`scope.node.moved.v1`) in every service that hosts them: award kinds, awards and their verifications, rule sets, segments and their memberships, webhook endpoints and deliveries, custom fields, their value sets and content revisions, comment threads, comments, their revisions and mentions, automations, checklists and their progress, and stored settings and their revisions. The audit log (append-only, its history kept) and the scope tree itself (moved by `moveSubtree`) stay out.
- Updated dependencies [4937622]
- Updated dependencies [93d63bb]
- Updated dependencies [7c34d68]
- Updated dependencies [26a2d54]
- Updated dependencies [7c34d68]
- Updated dependencies [7c34d68]
- Updated dependencies [03da426]
- Updated dependencies [246594d]
- Updated dependencies [93d63bb]
- Updated dependencies [41a5ff0]
- Updated dependencies [22493bf]
  - @stackra/i18n@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/market-packs@0.33.0
  - @stackra/tenancy@0.33.0
  - @stackra/model@0.33.0
  - @stackra/database@0.33.0
  - @stackra/ui@0.33.0
  - @stackra/icons@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/container@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [54db249]
  - @stackra/ui@0.32.0
  - @stackra/database@0.32.0
  - @stackra/icons@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/i18n@0.32.0
  - @stackra/market-packs@0.32.0
  - @stackra/tenancy@0.32.0
  - @stackra/model@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Minor Changes

- 0f05f60: Dates follow the tenant's calendar. `@stackra/i18n` adds `CalendarSystem` (`gregory`, `islamic-umalqura`, Intl's
  names). `formatDateTime` and `dateTimeFormatIn` take a `calendar` (Gregorian by default; an explicit
  `options.calendar` wins), and `I18nProvider` takes a `calendar` prop that `useDateTime` writes in. `@stackra/settings`
  adds `DisplaySettings` (key `display`, platform, product and tenant scopes, sent to clients) with `calendar`,
  Gregorian by default: the server reads it and passes it to `formatDateTime`, and an app passes it to `I18nProvider`.

### Patch Changes

- Updated dependencies [6473cf1]
- Updated dependencies [0f05f60]
- Updated dependencies [7179d1a]
  - @stackra/database@0.31.0
  - @stackra/i18n@0.31.0
  - @stackra/ui@0.31.0
  - @stackra/tenancy@0.31.0
  - @stackra/model@0.31.0
  - @stackra/icons@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/market-packs@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- 8c17109: Two new platform-scope settings groups with their source drivers. `IdempotencySettings` (`idempotency.retentionHours`,
  1 to 24, default 24, the cap of ADR 0136) is served by `SettingsIdempotencyRetentionSourceDriver`; `VersioningSettings`
  (`versioning.supportMonths`, at least 1, default 12) is served by `SettingsVersionSupportSourceDriver`.
- ef49e63: The rate-limit step can read a scope's limits from settings, so an operator lowers them without a deploy. When a
  `RateLimitCapSource` (new port in `@stackra/contracts`) is bound, each area bucket number and each default action
  bucket is the lower of its own and the scope's cap; a cap never raises a limit, and a failed read fails the call.
  `@stackra/settings` ships the driver, `SettingsRateLimitCapSourceDriver`, over the new `RateLimitSettings` group
  (`rate_limit.<area>PerMinute`, `<area>Burst`, `actionPerScope`, `actionPerAddress`; `null` caps nothing). With no
  source bound, nothing changes.
- 11def65: The settings tables are tenant-owned in the platform form (migration `settings.0004_contract_settings_tenancy`):
  `stored_settings` and `stored_setting_revisions` get a nullable `tenant_id`, filled from `app.tenant_id` by default (a
  NULL row is the platform's), forced row-level security and the platform policies. The migration backfills a row at a
  tenant node (`nlevel(scope_path) = 3`) from its scope and keeps a row at the root or a product node as a platform row.
  A user's row is now keyed `(tenant_id, group_key, user_id)` (NULLs not distinct), and every user lookup names the
  session's own owner. New system function `settings.claim_due_revisions` (no runtime caller yet).
  
  The `settings:diff` and `settings:apply` runner (`openSettingsSession`) now sets `app.tenant_id` by the same rule: a
  tenant node is its own owner, the root and a product node are the platform's, and a node below a tenant node is refused
  (the runner cannot read its tenant without the scope tree yet). `@stackra/cli`'s session-settings check allows that one
  write.
  
  Upgrade: the migration refuses, changing nothing, while a setting or revision sits below a tenant node or belongs to a
  user (a user row names no scope, so its tenant cannot be read, and as a platform row every tenant could read it).
  Record those values, delete the rows (`nlevel(scope_path) > 3`, or `user_id is not null`) from both tables, migrate,
  then write the values again from a session in each node's or user's tenant.

### Patch Changes

- c8e7592: `StoredSetting` and `StoredSettingRevision` are owned: both take `BelongsToTenantOrPlatform`, so a row's `tenant_id` is the running `withTenant` call's tenant, or NULL in a platform call. `@stackra/settings` now depends on `@stackra/tenancy`. The `settings:diff` and `settings:apply` runner writes through `TenantIsolationService.withTenant` as a system actor inside its `withScope` transaction, at a tenant node as that tenant and at the root or a product node as the platform, and no longer sets `app.tenant_id` itself. `@stackra/cli` drops the runner from `SESSION_SETTING_ALLOWED`.
- Updated dependencies [85cd1b5]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [d8d78f0]
- Updated dependencies [7b5a381]
- Updated dependencies [0394e56]
- Updated dependencies [8c17109]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [d5a7d0a]
- Updated dependencies [15dba8d]
- Updated dependencies [d3c8b27]
- Updated dependencies [d3c8b27]
  - @stackra/ui@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/database@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/container@0.30.0
  - @stackra/tenancy@0.30.0
  - @stackra/model@0.30.0
  - @stackra/i18n@0.30.0
  - @stackra/market-packs@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/icons@0.30.0

## 0.29.0

### Minor Changes

- 1b727b9: Settings fields are never dropped: gen refuses a field no setting type holds with `settings_unsupported_type`, and writes an enum or driver name as a `choice` key and a string or enum array as a `list` key (`SettingType.Choice`, `SettingType.List`, `SettingKeyInput.options`, and `readonly string[]` as a `SettingValue`). Gen derives the group key from the class name as the runtime does (`AccountSettings` is `Settings.account`), refuses `settings_scope_widened`, `settings_too_deep`, `settings_group_key_empty` and `settings_group_conflict`, and records every group and key in a `settings` section of `stackra.manifest.json`; a group or key rename needs `@Renamed`. An enum setting field is now `choice` with its `options`, not `string`, and a group whose key is not its module's carries the group in its label key. Regenerate with `stackra gen`.

### Patch Changes

- b26036e: `SettingsResolver#write` and `SettingsReader#write` refuse a key whose `scopes` leave out the level written (the page's, or `user` for a user's own layer) with `setting_scope_refused` (`SettingScopeRefusedError`), before anything is written; break-glass does not lift it. The level comes from the page and the target alone, so no new binding is needed and reads are unchanged.
- Updated dependencies [b4b6422]
- Updated dependencies [09b2c41]
- Updated dependencies [11a19a7]
  - @stackra/container@0.29.0
  - @stackra/database@0.29.0
  - @stackra/model@0.29.0
  - @stackra/icons@0.29.0
  - @stackra/ui@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/i18n@0.29.0
  - @stackra/market-packs@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- @stackra/database@0.28.0
  - @stackra/model@0.28.0
  - @stackra/icons@0.28.0
  - @stackra/ui@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/i18n@0.28.0
  - @stackra/market-packs@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [4a4d817]
  - @stackra/database@0.27.0
  - @stackra/model@0.27.0
  - @stackra/icons@0.27.0
  - @stackra/ui@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/i18n@0.27.0
  - @stackra/market-packs@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- Updated dependencies [93e358e]
- Updated dependencies [a9f21b6]
- Updated dependencies [e5da198]
  - @stackra/database@0.26.0
  - @stackra/ui@0.26.0
  - @stackra/model@0.26.0
  - @stackra/icons@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/i18n@0.26.0
  - @stackra/market-packs@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [1d7bbc1]
- Updated dependencies [dc9da69]
- Updated dependencies [8f8ddcf]
- Updated dependencies [3942ab1]
  - @stackra/database@0.25.0
  - @stackra/model@0.25.0
  - @stackra/icons@0.25.0
  - @stackra/ui@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/i18n@0.25.0
  - @stackra/market-packs@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [2df7162]
  - @stackra/database@0.24.0
  - @stackra/model@0.24.0
  - @stackra/icons@0.24.0
  - @stackra/ui@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/i18n@0.24.0
  - @stackra/market-packs@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Minor Changes

- fb6e2b3: A role-gated setting approval: `@Setting({ approval: { by: SystemRole.Owner } })` holds a change until someone holding
  that role approves it, beside the existing four-eyes `approval: true`. The revision records the role (`approvalRole`,
  migration `settings.0003_add_setting_revision_approval_role`); `SettingsResolver.approve(id, approver, roles)` refuses
  an approver without it (`SettingApproverRoleError`, forbidden) and fails closed when the calling action passes no roles.
  The role is the control, so its holder may approve a change they wrote; `decidedBy` records who did. One change needs
  one approving role. Gen treats a role-gated key as approval-marked too.

### Patch Changes

- Updated dependencies [12f4836]
- Updated dependencies [82238da]
- Updated dependencies [6edeee4]
- Updated dependencies [a2c8821]
- Updated dependencies [dee48f0]
  - @stackra/database@0.23.0
  - @stackra/ui@0.23.0
  - @stackra/model@0.23.0
  - @stackra/icons@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/i18n@0.23.0
  - @stackra/market-packs@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [b394912]
  - @stackra/database@0.22.0
  - @stackra/model@0.22.0
  - @stackra/icons@0.22.0
  - @stackra/ui@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/i18n@0.22.0
  - @stackra/market-packs@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/model@0.21.0
  - @stackra/database@0.21.0
  - @stackra/ui@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/i18n@0.21.0
  - @stackra/market-packs@0.21.0
  - @stackra/icons@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [80d121b]
- Updated dependencies [a7b7e58]
- Updated dependencies [19a9222]
- Updated dependencies [667a3b5]
  - @stackra/database@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/model@0.20.0
  - @stackra/icons@0.20.0
  - @stackra/ui@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/i18n@0.20.0
  - @stackra/market-packs@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [b59aa22]
- Updated dependencies [bac874e]
- Updated dependencies [12f25aa]
- Updated dependencies [e5f5432]
- Updated dependencies [40fda23]
- Updated dependencies [dd9427a]
- Updated dependencies [4a23af8]
- Updated dependencies [fc845f4]
- Updated dependencies [d2b3d22]
  - @stackra/contracts@0.19.0
  - @stackra/database@0.19.0
  - @stackra/model@0.19.0
  - @stackra/ui@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/i18n@0.19.0
  - @stackra/market-packs@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/icons@0.19.0

## 0.18.1

### Patch Changes

- @stackra/database@0.18.1
  - @stackra/model@0.18.1
  - @stackra/icons@0.18.1
  - @stackra/ui@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/i18n@0.18.1
  - @stackra/market-packs@0.18.1
  - @stackra/validation@0.18.1

## 0.18.0

### Patch Changes

- @stackra/database@0.18.0
  - @stackra/model@0.18.0
  - @stackra/icons@0.18.0
  - @stackra/ui@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/i18n@0.18.0
  - @stackra/market-packs@0.18.0
  - @stackra/validation@0.18.0

## 0.17.2

### Patch Changes

- @stackra/database@0.17.2
  - @stackra/model@0.17.2
  - @stackra/icons@0.17.2
  - @stackra/ui@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/i18n@0.17.2
  - @stackra/market-packs@0.17.2
  - @stackra/validation@0.17.2

## 0.17.1

### Patch Changes

- Updated dependencies [0b917cf]
  - @stackra/market-packs@0.17.1
  - @stackra/database@0.17.1
  - @stackra/model@0.17.1
  - @stackra/icons@0.17.1
  - @stackra/ui@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/i18n@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Patch Changes

- @stackra/database@0.17.0
  - @stackra/model@0.17.0
  - @stackra/icons@0.17.0
  - @stackra/ui@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/i18n@0.17.0
  - @stackra/market-packs@0.17.0
  - @stackra/validation@0.17.0

## 0.16.0

### Patch Changes

- c6e4715: `#stackra/settings` keys a section's field `<section>.<name>`, so two sections of one module may share a field name
  without a duplicate key (TS1117). `settingKeys` strips the section back off: each key keeps its `name` and its
  `<module>.<section>.<name>` path, and files written by an older gen still work.
- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/database@0.16.0
  - @stackra/model@0.16.0
  - @stackra/icons@0.16.0
  - @stackra/ui@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/i18n@0.16.0
  - @stackra/market-packs@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/database@0.15.0
  - @stackra/model@0.15.0
  - @stackra/icons@0.15.0
  - @stackra/ui@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/i18n@0.15.0
  - @stackra/market-packs@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- 6406843: `SettingKeyInput` extends `SettingOptions` instead of repeating its fields. The shape is unchanged.
- cc150d2: The native `SettingsForm`, `useMenu`, `useMenus` and the menu flag check now share their logic with the web entry
  (`useSettingsForm`, `useMenuResolverWith`, `useMenuFrom`) instead of keeping copies. Behaviour and exports are unchanged.
- @stackra/database@0.14.4
  - @stackra/model@0.14.4
  - @stackra/icons@0.14.4
  - @stackra/ui@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/i18n@0.14.4
  - @stackra/market-packs@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- @stackra/database@0.14.3
  - @stackra/model@0.14.3
  - @stackra/icons@0.14.3
  - @stackra/ui@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/i18n@0.14.3
  - @stackra/market-packs@0.14.3
  - @stackra/validation@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/database@0.14.2
  - @stackra/model@0.14.2
  - @stackra/icons@0.14.2
  - @stackra/ui@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/i18n@0.14.2
  - @stackra/market-packs@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/database@0.14.1
  - @stackra/model@0.14.1
  - @stackra/icons@0.14.1
  - @stackra/ui@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/i18n@0.14.1
  - @stackra/market-packs@0.14.1
  - @stackra/validation@0.14.1

## 0.14.0

### Patch Changes

- @stackra/database@0.14.0
  - @stackra/model@0.14.0
  - @stackra/icons@0.14.0
  - @stackra/ui@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/i18n@0.14.0
  - @stackra/market-packs@0.14.0
  - @stackra/validation@0.14.0

## 0.13.0

### Patch Changes

- @stackra/database@0.13.0
  - @stackra/model@0.13.0
  - @stackra/icons@0.13.0
  - @stackra/ui@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/i18n@0.13.0
  - @stackra/market-packs@0.13.0
  - @stackra/validation@0.13.0

## 0.12.0

### Patch Changes

- @stackra/database@0.12.0
  - @stackra/model@0.12.0
  - @stackra/icons@0.12.0
  - @stackra/ui@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/i18n@0.12.0
  - @stackra/market-packs@0.12.0
  - @stackra/validation@0.12.0

## 0.11.1

### Patch Changes

- @stackra/database@0.11.1
  - @stackra/model@0.11.1
  - @stackra/icons@0.11.1
  - @stackra/ui@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/i18n@0.11.1
  - @stackra/market-packs@0.11.1
  - @stackra/validation@0.11.1

## 0.11.0

### Patch Changes

- @stackra/database@0.11.0
  - @stackra/model@0.11.0
  - @stackra/icons@0.11.0
  - @stackra/ui@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/i18n@0.11.0
  - @stackra/market-packs@0.11.0
  - @stackra/validation@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/icons@0.10.0
  - @stackra/ui@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/i18n@0.10.0
  - @stackra/market-packs@0.10.0
  - @stackra/model@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [b174a17]
- Updated dependencies [681d01a]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/model@0.9.0
  - @stackra/ui@0.9.0
  - @stackra/container@0.9.0
  - @stackra/database@0.9.0
  - @stackra/icons@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/i18n@0.9.0
  - @stackra/market-packs@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/model@0.8.0
  - @stackra/icons@0.8.0
  - @stackra/ui@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/i18n@0.8.0
  - @stackra/market-packs@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/database@0.7.1
  - @stackra/model@0.7.1
  - @stackra/icons@0.7.1
  - @stackra/ui@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/i18n@0.7.1
  - @stackra/market-packs@0.7.1
  - @stackra/validation@0.7.1

## 0.7.0

### Minor Changes

- 1f5bf76: A new `@stackra/settings/react` entry. `SettingsForm` renders a generated settings page on the web, at parity with
  the native form: a switch for each on-or-off key, a text field for each number or text key, a locked key read-only,
  and each change written through the container's `SettingsReader` at the page's level, with a refused change restored
  and its reason shown and announced. `useSetting(page, name)` reads and writes one key the same way, for a host that
  lays out its own screen. The showcase lists the form under Blocks.

### Patch Changes

- @stackra/database@0.7.0
  - @stackra/model@0.7.0
  - @stackra/icons@0.7.0
  - @stackra/ui@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/i18n@0.7.0
  - @stackra/market-packs@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- @stackra/database@0.6.1
  - @stackra/model@0.6.1
  - @stackra/icons@0.6.1
  - @stackra/ui@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/i18n@0.6.1
  - @stackra/market-packs@0.6.1
  - @stackra/validation@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [fb29d41]
- Updated dependencies [d53d9d3]
- Updated dependencies [712fb89]
  - @stackra/database@0.6.0
  - @stackra/ui@0.6.0
  - @stackra/model@0.6.0
  - @stackra/icons@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/i18n@0.6.0
  - @stackra/market-packs@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/model@0.5.1
  - @stackra/icons@0.5.1
  - @stackra/ui@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/i18n@0.5.1
  - @stackra/market-packs@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [d7f72d3]
- Updated dependencies [d7f72d3]
  - @stackra/i18n@0.5.0
  - @stackra/ui@0.5.0
  - @stackra/database@0.5.0
  - @stackra/model@0.5.0
  - @stackra/icons@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/market-packs@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Minor Changes

- f490040: Add `SettingsApprovalSourceDriver`, the `ApprovalSettingsSource` driver (STA-1724, ADR 0509): it reads the effective value of an
  `approval`-marked setting key through `SettingsResolver` for the running scope, and refuses an unknown key or one not marked
  `approval`. Settings does not depend on `@stackra/actions`.

### Patch Changes

- 3ce01cf: A package's entity list is a committed generated contract, `src/node/entities.gen.ts`, written by `stackra gen` and kept
  fresh by `stackra gen --check` (ADR 0294 R10 and ADR 0295, amended 2026-11-01, STA-1874). Each package's `./node` now
  ships its `<KEY>_ENTITIES` inlined in the build instead of importing the gitignored `.stackra/gen/entities/` at runtime,
  which failed: the 0.3.0 builds of these packages carry that broken import until this release. `stackra validate`
  expects the re-export from `#node/entities.gen`, and the doc standard skips `*.gen.ts` files.
- 36dbd49: Each package with models of its own exports `<MEMBER>_ENTITIES` from `./node`, which a hosting service's generated
  `registrations.ts` imports to register the package's entities; without it the service failed with TS2305 (STA-1793). `stackra validate --repository` refuses a package with own
  models whose stand-in `./node` barrel misses it.
- 9574c22: `SettingsResolver#applyChange` now takes `breakGlass` in its meta and records it on the revision (STA-1692). A
  break-glass change with an empty or blank reason throws a `TypeError` before anything is written. Without the flag the
  revision records `breakGlass: false`, as before.
- 2f5ab1e: `SettingsFake.set` keeps an array (or date) value whole instead of flattening it into `<field>.0` paths, so an array setting reads back as the array.
- dbb60dc: `SettingsReader#get` is covered for a section nothing stored (every default), a partial stored section (stored values
  kept, the rest defaulted) and a wrong-typed stored value (still refused), over the schema gen now emits.
- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [4f3f1ed]
- Updated dependencies [e070131]
- Updated dependencies [d675b4d]
- Updated dependencies [3df2c07]
- Updated dependencies [2d6bb63]
- Updated dependencies [7dc74f6]
- Updated dependencies [d9bf3c2]
- Updated dependencies [90f55b1]
- Updated dependencies [1c22c33]
- Updated dependencies [688cf0c]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [8d29426]
- Updated dependencies [2bbc0e8]
- Updated dependencies [149ca06]
- Updated dependencies [1567384]
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/container@0.4.0
  - @stackra/market-packs@0.4.0
  - @stackra/model@0.4.0
  - @stackra/ui@0.4.0
  - @stackra/icons@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/i18n@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [c4443b5]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [be75ede]
- Updated dependencies [e6a582a]
- Updated dependencies [895a526]
- Updated dependencies [9ed272a]
- Updated dependencies [6484453]
  - @stackra/database@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/i18n@0.3.0
  - @stackra/icons@0.3.0
  - @stackra/market-packs@0.3.0
  - @stackra/model@0.3.0
  - @stackra/ui@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [9085c41]
- Updated dependencies [c4f295e]
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/ui@0.2.0
  - @stackra/market-packs@0.2.0
  - @stackra/model@0.2.0
  - @stackra/icons@0.2.0
  - @stackra/container@0.2.0
  - @stackra/i18n@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- 56dde43: Add `AccountSettings` (key `account`, platform and user scopes) with `locale`, the language a person chose in an app,
  stored server-side at their own holder so emails, notifications, the web and their other devices follow it (STA-1534).
- 786f390: Add entitlement-gated settings: `@Setting({ entitlement, entitlementValues })`, the `SettingEntitlementSource` port
  with a memory driver, reads that fall back to the default with provenance `entitlement`, and writes refused
  `entitlement_required` (ADR 0420). Add `settingSystemAuthor(name)` for seed writes, `MarketPackSettingFloorSourceDriver`,
  and a `market` option on `settingsApply` so a floor-bearing group can be applied (ADR 0419).
- f7a2d36: `SettingsFake#set` writes a new value mid-test.
- 2787c1e: Add `@stackra/settings`: the `Settings({ scopes, navigation })` kind and `@Setting`, `SettingsReader` resolving a
  module's group through the scope cascade with locks, the `SettingValueStore` port with its memory and Postgres drivers
  and the stored-settings table, `settingKeys` and `settingsPage`, the native `SettingsForm` and `fakeSettings`.
- 69363bf: Retire `SettingLiveReadOnlyError`: a write to read-only live configuration is the core `live_read_only` refusal. Add
  promotion rollback (`Promotable.rollbackOf`, the replaced snapshot in `PromotionDiff.previous`), a change set's
  minimum release (`PromotionReleaseTooOldError`), floor lifting in `SettingsReader#get`, the `settingsDiff` and
  `settingsApply` runner with `RegisteredFloorGuardDriver`, and `fakeResolver` in `./testing` (ADR 0395).
- 9759078: Add the settings-layer resolver: `SettingsResolver` reads a group with the legal floors of the target's market pack
  (`SettingFloorSource`, `settingFloorsOf` over `@stackra/market-packs`), refuses a write below a floor and lifts a value
  when a floor rises, gives each key its provenance, refuses structural keys on live (`@Setting({ live })`, break-glass
  with a reason), and records every write as a revision with four-eyes approval and schedules (`SettingRevisionStore`,
  memory and Postgres drivers, `settings.stored_setting_revisions`). Add YAML settings packs with export, diff and apply
  (`SettingsPackService`, `diffSettingsPacks`, `SettingsPack$`), developer and normal display modes
  (`@Setting({ essential })`, `visibleSettingFields`), and the `Promotable` port homed here with `SettingsPromotableDriver`.
  `SettingValueStore` gains `remove`, and each layer names its `holder`.
- 2babf37: Ship the `X$` schema of each contract type a shape field names (STA-1284): `Address$`, `ScopeRef$`, `Actor$`,
  `Signature$` and `SignerPublicKey$` from `@stackra/validation`; `IsoDate$`, `HijriDate$`, `WorkingWeek$` and the
  `WorkingWeek` type from `@stackra/calendar`; `CustomFieldDefinition$` and `CustomFieldValue$` from `@stackra/content`;
  `ImportChange$` and `RowError$` from `@stackra/data-transfer/contracts`; `PromotionDiff$` from
  `@stackra/settings/contracts`; `Audience$` from `@stackra/iam/contracts`. `Condition$` already ships from
  `@stackra/rules`.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [94ae85f]
- Updated dependencies [dddbbcd]
- Updated dependencies [856995c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [ca85d59]
- Updated dependencies [d72a734]
- Updated dependencies [9841d79]
- Updated dependencies [f6d1a76]
- Updated dependencies [c196bc6]
- Updated dependencies [49ab0e6]
- Updated dependencies [d156aa8]
- Updated dependencies [6d46e5e]
- Updated dependencies [2787c1e]
- Updated dependencies [38a5501]
- Updated dependencies [e0f2fc8]
- Updated dependencies [62c7ae1]
- Updated dependencies [c868bad]
- Updated dependencies [0d36f0d]
- Updated dependencies [a701ccb]
- Updated dependencies [a526605]
- Updated dependencies [da8bdbd]
- Updated dependencies [763e901]
- Updated dependencies [936fcb1]
- Updated dependencies [f11cbe8]
- Updated dependencies [f7a2d36]
- Updated dependencies [dfa0c6a]
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [483eb44]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
- Updated dependencies [9fa447e]
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [d8ea8c2]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [c21a223]
- Updated dependencies [c1818fd]
- Updated dependencies [b88a78d]
- Updated dependencies [38ef655]
- Updated dependencies [d5e5ff8]
- Updated dependencies [9841d79]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c580aa4]
- Updated dependencies [7e60fa9]
- Updated dependencies [b62c042]
- Updated dependencies [e52a367]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9fc14fd]
- Updated dependencies [0a20a9f]
- Updated dependencies [d5f5acf]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [a31d463]
- Updated dependencies [158f6cf]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [1271b88]
- Updated dependencies [ab9cc36]
- Updated dependencies [f04fec9]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [897ef24]
- Updated dependencies [9fa447e]
- Updated dependencies [5ae6115]
- Updated dependencies [d41fc93]
- Updated dependencies [9fa447e]
- Updated dependencies [d44e69c]
- Updated dependencies [9fa447e]
- Updated dependencies [b58ebce]
- Updated dependencies [3f2898c]
- Updated dependencies [9fa447e]
- Updated dependencies [69e90f1]
- Updated dependencies [9fa447e]
- Updated dependencies [1c29328]
- Updated dependencies [57f55b7]
- Updated dependencies [2e21e6a]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [e193feb]
- Updated dependencies [65da65c]
- Updated dependencies [65da65c]
- Updated dependencies [69e90f1]
- Updated dependencies [3f2898c]
- Updated dependencies [69e90f1]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/ui@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/icons@0.1.0
  - @stackra/market-packs@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
