# console: the LICENSE names the right legal holder

**Linear**: STA-1870
**Status**: implementing
**Clarifications status**: complete

## Problem

`packages/developer/console/LICENSE` reads `Copyright (c) 2026 Fulers Technologies L.L.C.`. The owner's standing rule:
the legal holder is Figentra Technologies L.L.C, never Fulers or FZ-LLC. The other 117 LICENSE files in core read
`Figentra Technologies L.L.C.`, and this is the only `Fulers` outside the CHANGELOGs.

## Change

The copyright line names `Figentra Technologies L.L.C.`, as every other LICENSE does. ADR 0024 and ADR 0291 mention
FZ-LLC only as the wrong form and stay as they are.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/console (LICENSE only)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: chore
- **Change risk**: R0
