# Feature Specification: settings tenant level and a system author for seeders

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-825

**Clarifications status**: complete

**Input**: OS gate-A gap (audit SPEC gap 6, notifications SPEC gap 7): the template writes `SettingScope.Tenant`; a seeder has no author principal.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/state/settings
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0419 (Proposed)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** No `SettingScope.Tenant`: the tenant level is `TenancyScopes.Tenant` (ADR 0323 d4); the settings README and AGENTS say so.
- **FR-002** `settingSystemAuthor(name)` answers `sys_<name>` for a lower snake_case job name and refuses any other name.

## Not built here

- Changing the template (`template/packages/commerce/loyalty-kit`, `template/apps/*/.stackra/gen/*`) from `SettingScope.Tenant` to `TenancyScopes.Tenant`: outside the wave 12 boundary.
- Gen emitting `TenancyScopes.Tenant` in the generated settings files: @stackra/gen.
- Tests, typecheck and build are written but not run (owner mode).
