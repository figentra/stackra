# Feature Specification: the wiring binds the services the generated boot resolves

**Feature Branch**: `figentra/sta-2674-wiring-binds-boot`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2674

**Clarifications status**: complete

**Input**: STA-2664 (n), from the OS lane's local run (os#305). The generated `boot.ts` resolves `OutboxWriterService`,
`OutboxRelayService`, `InboxService` and `EventBus` for a service that declares `@stackra/outbox` (and
`SegmentService`, `AutomationService`, `QueueWorkerService` for segments, workflow and queue). The generated wiring
binds a package's service only when a class injects it, and nothing injects these, so identity stops at boot:
"Nothing binds OutboxWriterService".

### Sources

- `packages/developer/gen/src/core/functions/emit-boot.function.ts` (what boot resolves, and when)
- `packages/developer/gen/src/core/functions/emit-wiring.function.ts` (the `used` worklist)
- The outbox, events, segments, workflow and queue manifests (each lists the service with its dependencies)
- figentra/os#305, docs/dev-run.md section 5

## Impact

- **Apps touched**: none
- **Services touched**: none (their generated wiring gains rows on the next gen)
- **Packages touched**: packages/developer/gen (a constant, the wiring emitter, tests, golden files)
- **Public contract change**: none; the generated wiring binds services the generated boot already resolves
- **Cross-service events**: none; the outbox and inbox now run where they were declared
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: none
- **Lane**: full
- **Change risk**: R2 (every service that declares the outbox gains bindings)

## Acceptance criteria

- **AC-001**: WHEN a service declares a package whose services the generated boot resolves THE generated wiring SHALL
  bind each of those services, with its dependencies from the package's manifest.
- **AC-002**: WHEN binding a boot service needs a package the service does not declare THE generator SHALL refuse it
  (`generated_dependency_missing`), never write a wiring that boot cannot resolve.

## Status history

- 2026-11-10 → Clarified (boot and wiring read the same declared packages; only the wiring missed them)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10 (0.33.1 item 1)
- 2026-11-10 → Tasked (tasks.md; built in the same branch)
