# Feature Specification: two-driver ports are chosen by a config selector with a default

**Feature Branch**: `figentra/sta-2675-port-selectors`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2675

**Clarifications status**: complete

**Input**: STA-2664 (k), 0.33.1 item 2, from the OS lane's local run (os#305). A port with two or more driver
candidates and no selector fails a host's boot: "its drivers are X, Y, and no config field selects one". The container
takes a package's own `default` only in that package's own tests, so a host needs a config field (`selectedBy`). Six
ports have none: `Database`, `SettingValueStore`, `SettingFloorSource`, `SessionStore`, `Storage` and
`AppApprovalChallenges` (`SecretStore` is stackra#1016).

### Sources

- `packages/foundation/container/src/core/services/container.service.ts` (`chooseDriver`)
- stackra#1016 (`SecretsConfig.store`, the pattern)
- The six ports and their drivers in database, settings, storage and identity
- figentra/os#305, docs/dev-run.md section 5; the leader's defaults of 2026-11-10

## Impact

- **Apps touched**: none (gen's per-runtime defaults come before `selectedBy`, so apps keep their drivers)
- **Services touched**: none (a service's boot now resolves these ports with the defaults)
- **Packages touched**: database (`DatabaseConfig.driver`), settings (new `SettingsConfig`), storage (new
  `StorageConfig`), identity (`IdentityConfig.sessionStore`, `approvalChallenges`); their manifests
- **Public contract change**: new config fields and two new config classes (`settings`, `storage`); each port declares
  its key; each manifest names its selector
- **Cross-service events**: none
- **Tenancy and data**: none; the default drivers are today's, production selects its own in config
- **Security and privacy**: none; no driver changes behaviour
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: the four packages' READMEs (the selector each)
- **Lane**: full
- **Change risk**: R2 (every service that injects one of these ports boots on the default)

## Acceptance criteria

- **AC-001**: THE `Database` port SHALL be selected by `DatabaseConfig.driver`, defaulting to `postgres`.
- **AC-002**: THE `SettingValueStore` and `SettingFloorSource` ports SHALL be selected by `SettingsConfig.store` and
  `SettingsConfig.floors` (key `settings`), each defaulting to `memory`.
- **AC-003**: THE `Storage` port SHALL be selected by `StorageConfig.driver` (key `storage`), defaulting to `memory`.
- **AC-004**: THE `SessionStore` and `AppApprovalChallenges` ports SHALL be selected by `IdentityConfig.sessionStore`
  and `IdentityConfig.approvalChallenges`, each defaulting to `memory`.
- **AC-005**: WHEN a host boots with no config for these ports THE container SHALL resolve the default drivers, never
  refuse with `UnresolvedPortError`.

## Status history

- 2026-11-10 → Clarified (a host needs `selectedBy`; a package `default` reaches only its own tests)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10 (0.33.1 item 2, the defaults)
- 2026-11-10 → Tasked (tasks.md; built in the same branch)
