# payments declares @stackra/actions

**Linear**: STA-1873
**Status**: implementing
**Clarifications status**: complete

## Problem

`stackra gen` refuses `@stackra/payments` on main: `generated_dependency_missing`: its generated
`.stackra/gen/wiring.ts` imports `@stackra/actions`, which payments' `package.json` does not declare. Its source does
not import the package; the wiring does, for the action ports the drivers it binds serve.

## Change

Add `"@stackra/actions": "workspace:*"` to payments' dependencies, as gen's fix says, and its `link:` importer entry to
`pnpm-lock.yaml` (a workspace link, so CI's frozen install stays current). `@stackra/actions` is a `tier:lib`
package, so the tier direction holds.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/payments (a dependency)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: @stackra/actions (workspace)
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1
