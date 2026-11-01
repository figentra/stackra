# One meaning for "seed": the console's db:seed becomes seed-pack:status

**Linear**: STA-1852
**Status**: implementing
**Clarifications status**: complete

## Problem

After the consolidation (STA-1829) two commands share the word: `stackra db seed` (STA-1709) runs a service's seeders,
and the `@stackra/database` console command `db:seed` (STA-1731) only reports the records of a seed pack the ledger
holds. One word, two meanings (ADR 0294 decision 23).

## Decision

Approved by the leader on 2026-11-01 as a technical call: keep `stackra db seed` for running seeders, and rename the
console command to `seed-pack:status`, beside the `stackra seed-pack` planner whose output it reports.

## Change

- `DbSeedCommand` (`db-seed.command.ts`, `db:seed`) becomes `SeedPackStatusCommand` (`seed-pack-status.command.ts`,
  `seed-pack:status`); behaviour unchanged.
- The barrel, its export test, the command's test and the committed manifest follow the rename. Command names are not
  identity-locked (`checkIdentityLock`), so no `@Renamed` is needed.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/database
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no; it applies ADR 0294 decision 23
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1
