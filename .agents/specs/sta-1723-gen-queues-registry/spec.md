# Feature Specification: a typed queues registry (`#stackra/queues`)

**Feature Branch**: `figentra/sta-1723-gen-queues-registry`

**Created**: 2026-10-31

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-1723

**Clarifications status**: complete

**Input**: OS · Services A (figentra/billing#2): billing's renewal and dunning jobs name their queue as the string
`"billing"` because gen 0.2.0 writes no `#stackra/queues`. Payments-ledger and content do the same. Gen should emit a
typed `Queues` registry per member, so a job or dispatch writes `Queues.Billing` and a renamed queue is a type error.

## Impact

- **Apps touched**: none
- **Services touched**: none in core (billing, payments-ledger and content drop their literals afterwards, in OS)
- **Packages touched**: packages/developer/gen (a new emitter, the reader, generate-member, README)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (a generated registry beside `#stackra/i18n` and `#stackra/clients`, under ADR 0294 decision 20)
- **New dependencies**: none (the file calls `queues()` of `@stackra/queue`, which a member with a job already has)
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: gen README (generated files table)
- **Lane**: full
- **Change risk**: R1 (a new generated file; existing literals keep working)

## Questions answered

1. **What does the file hold?** `.stackra/gen/queues.ts`, imported as `#stackra/queues`:
   `export const Queues = queues(["billing", "default"] as const);`, using `queues()` of `@stackra/queue`, which
   already maps snake_case names to PascalCase keys (`ledger_close` → `Queues.LedgerClose`) and refuses a bad name.
2. **Which queues?** Every queue a job action in the member's manifest names (the hosted packages' included, as
   `emitEncoreQueues` already collects them), plus `default`, sorted. It is written for a service with at least one
   job action, as `emitEncoreQueues` is: such a service already depends on `@stackra/queue`, and a package's jobs run
   on its host's queues, so a package gets no file of its own.
3. **Can a job's own options use it?** Yes. The reader reads `Queues.<Name>` imported from `#stackra/queues` as its
   snake_case name by syntax, as it reads `I18n.<ns>.<path>` (STA-1296), so `@Job({ queue: Queues.Billing })` works
   before the file exists and on a fresh clone. The name a job writes this way is the name the registry then lists.
4. **How is a name read back?** `LedgerClose` → `ledger_close` (an underscore before each capital after the first,
   lowercased). A queue whose part starts with a digit (`v_2`) cannot round-trip (`V2` reads `v2`); such a queue keeps
   its literal, and the README says so.
5. **What makes a rename a type error?** `Queues` is an `Enum.of` value, so `Queues.Billing` is the literal type
   `"billing"`; when no job names `billing` any more, the key is gone and every `Queues.Billing` fails to compile.
6. **Do literals still work?** Yes; nothing refuses `queue: "billing"`. The OS services switch when they move to 0.2.1.
7. **Hosted packages?** A service's file lists its hosted packages' job queues too (they run on its workers).

## Decisions

- **Q1** (leader, 2026-10-31): job queues plus `default` only for 0.2.1; runway.yaml queues are not a source. The check
  that every derived queue has a runway entry is STA-1727.

## Requirements

- **FR-1** Gen writes `.stackra/gen/queues.ts` for a service with a job action: `Queues = queues([...] as const)` over
  the sorted set of its job actions' queues (hosted packages' included for a service) plus `default`.
- **FR-2** The reader reads `Queues.<PascalName>` imported from `#stackra/queues` as `<snake_name>` wherever it reads a
  constant (a job's `queue` option included), before the file exists.
- **FR-3** No file for a package, an app or a service without a job action.
- **FR-4** Tests: the emitter (a service with jobs, a package, an app, a service without jobs), the reader (a job writing
  `Queues.LedgerClose` reads `ledger_close`), and the goldens wherever a fixture has a job.

## Status history

- 2026-10-31: Draft → Clarified (questions answered from gen's emitters and `@stackra/queue`)
- 2026-10-31: Clarified → Planned (plan.md) — Approved by leader 2026-10-31
- 2026-10-31: Planned → Tasked (tasks.md; built in the same commit)
