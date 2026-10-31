# Plan: call isolation

**Spec**: `.agents/specs/sta-1699-call-isolation/spec.md`

## Design

- `CallIsolation` abstract class in `@stackra/actions` contracts; the pipeline wraps the call after the tenancy step.
- `CallIsolationDriver` in `@stackra/tenancy/node` composes `Database.withScope` and `TenantIsolationService.withTenant`.
- Queue, outbox, workflow and scheduler take the port optionally from actions and fall back to `withScope`.
- `tools/scripts/session-setting-placement.mjs` is the guard, wired into `validate-repository.mjs`.

## Properties

- **P-001** Validates: FR-001, FR-002, FR-003, FR-005, FR-006: a call sees only its tenant's rows and leaves no setting behind.
- **P-002** Validates: FR-004: no source sets an `app.*` setting for the session.

## Constitution Check

| Law                       | Result | Note                                                        |
| ------------------------- | ------ | ----------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | actions imports no tenancy; background packages use actions |
| Tenancy                   | PASS   | this is the isolation rule itself                           |
| Secrets                   | PASS   | none involved                                               |
| Not built yet (ADR 0227)  | PASS   | no new technology                                           |
| Test placement (ADR 0022) | PASS   | `__tests__/` beside the subject                             |
| Versions and catalogs     | PASS   | no dependency change                                        |

## Deploy modes

| Mode       | Result | Note           |
| ---------- | ------ | -------------- |
| saas       | PASS   | same code      |
| on-prem    | PASS   | same code      |
| air-gapped | PASS   | no network use |
