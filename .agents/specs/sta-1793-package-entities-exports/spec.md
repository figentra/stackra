# Bug Specification: packages with models export their entity list

**Feature Branch**: `figentra/sta-1793-package-entities-exports`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1793

**Clarifications status**: complete

**Input**: Leader, for 0.2.2 (2026-11-01). Gen's `.stackra/gen/registrations.ts` of a service imports
`<MEMBER>_ENTITIES` from `@stackra/<pkg>/node` for every hosted package whose manifest lists models of its own, and gen's
own package barrels export it (`emitPackageEntries`). But every such package still ships a hand-written stand-in
`./node` barrel that does not, so all 8 juristra services fail with TS2305 (access-log, ai, rules, scope, settings), and
f4's Services A gate found the same in 13 node entries. Exporting the list from each package matches how gen registers
a package's entities; dropping the import would leave those entities unregistered.

## Impact

- **Apps touched**: none
- **Services touched**: none in core (juristra's 8 services and OS Services A typecheck)
- **Packages touched**: the 13 packages with own models (achievements, ai, rules, segments, loyalty-kit, webhooks,
  content, collaboration, panel, workflow, access-log, scope, settings): one export line in `src/node/index.ts` and the
  name in its exact-export test
- **Cross-service events**: none
- **Tenancy and data**: none (the same entities, now reachable)
- **Secrets**: none
- **ADR needed**: no (ADR 0294 decision 15: the entries gen writes already export it)
- **New dependencies**: none
- **Deploy modes**: all
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1 (an added export per package; a validate check)

## Requirements

- **FR-001** Each package whose manifest lists own models exports `<MEMBER>_ENTITIES` from `./node`, re-exported from
  `#stackra/entities/<member>`.
- **FR-002** `pnpm validate` refuses a package with own models whose stand-in `./node` barrel does not
  (`stackra validate --repository`, `packages/developer/cli/src/node/package-entities/`), with a vitest test over
  fixtures and this checkout.

## Status history

- 2026-11-01 → Clarified (leader's 0.2.2 item)
