# Specification: load the database testing tier's faker and PGlite on first use

**Feature Branch**: `figentra/sta-1812-lazy-test-peers`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1812

**Clarifications status**: complete

**Input**: `@stackra/database` declares `@faker-js/faker`, `@electric-sql/pglite`, `@electric-sql/pglite-pgvector` and
`@mikro-orm/pglite` as optional peer dependencies, but `src/testing` imports them statically. Gen's vitest setup loads
`@stackra/database/testing` in every service, so a service without them fails at import, before any test. Decision
(agreed with the testing session): keep them optional peers and load them on first use.

## Impact

- **Apps touched**: none
- **Services touched**: none (the `pnpm new service` template gains the four devDependencies, if it has a list)
- **Packages touched**: `packages/data/database` (testing entry only)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0269 decision 3 already confines them to the testing entry)
- **New dependencies**: none (no catalog change)
- **Deploy modes**: all, no change
- **Licence tier**: free
- **Docs to update**: the package README (testing section)
- **Lane**: lite
- **Change risk**: R2 (test tooling only; no runtime entry changes)

## Requirements

- **FR-001** Importing `@stackra/database/testing` loads none of the four packages.
- **FR-002** The first use (a factory reading Faker, a memory database reading the ORM) loads them; the public API and
  types do not change.
- **FR-003** A missing package throws one Error naming all four and saying to add them as catalog devDependencies.

## Status history

- 2026-11-01 → Clarified (testing session decision)
