# Feature Specification: the OS template lines on the registry

**Feature Branch**: `figentra/sta-1828-registry-internal-src`

**Created**: 2026-11-01

**Status**: Implementing <!-- owner approved through the leader, 2026-11-01: "Yes, internal only" -->

**Linear**: STA-1828

**Clarifications status**: complete

**Input**: runway checks the OS template lines out of the registry (ADR 0481), and they have never been published.
`figentra/os` is not a trusted publisher of `@figentra` yet. The scope's `commercial` licence rule also refuses `src/`
and source maps, but `@figentra/os-mobile` must ship its sources, because EAS builds from them (ADR 0481 decision 2).
The owner chose (2026-11-01) to apply the no-sources rule only to licensed scopes. An internal scope may ship sources
and maps, since only a Figentra internal licence reads it.

## Impact

- **Apps touched**: `apps/docs` (ADR 0453 amendment of 2026-11-01)
- **Services touched**: none
- **Packages touched**: `workers/registry` (migration `0006_figentra_os.sql`, `src/publish/check-publish.ts`, tests, README)
- **Cross-service events**: none
- **Tenancy and data**: one seed row in the registry's D1 (`publishers`); no schema change
- **Secrets**: none
- **ADR needed**: an amendment of ADR 0453 (decision 7's source ban, and the decision 10 publisher row)
- **New dependencies**: none
- **Deploy modes**: the registry Worker; applied by the owner's "Deploy registry" run
- **Licence tier**: internal (`@figentra`); `@stackra-pro` is unchanged
- **Docs to update**: ADR 0453, `workers/registry/README.md`
- **Lane**: lite
- **Change risk**: R2 (production registry rules and seed data)

## Requirements

- **FR-001** Migration `0006_figentra_os.sql` in the form of 0004: the `figentra/os` publisher row for `@figentra`
  (repository id 1427748269, owner 314302700, `.github/workflows/release.yml`, `refs/heads/main`, `release`).
  This is figentra/stackra#184.
- **FR-002** `checkPublish` refuses `src/` and `.map` files only when the scope's read rule is not `internal`. Every
  other commercial check (the licence name and the LICENSE file) still applies to an internal scope.
- **FR-003** ADR 0453 records both changes; the README names the publisher, the migration and the rule.
