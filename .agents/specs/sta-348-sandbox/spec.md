# Feature Specification: `@stackra/sandbox`, the QuickJS code step

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: the package-needs row "`@stackra/sandbox` — approved, not on disk — QuickJS code step, after launch — OS
workflow-automations — Stackra 0154; round 3 #28", and ADR 0154 (tenant code runs only in a sandboxed code step).

## Impact

- **Apps touched**: none
- **Services touched**: none (OS workflow-automations adopts it and binds the fetch proxy)
- **Packages touched**: `packages/runtime/sandbox` (new member)
- **Tenancy and data**: no table; step input and output live in the QuickJS heap for one run
- **Secrets**: none
- **ADR needed**: no (ADR 0154 decides it)
- **New dependencies**: `quickjs-emscripten` (MIT), default catalog
- **Deploy modes**: same code in SaaS, on-prem and air-gapped (ADR 0154 d3)
- **Licence tier**: free (MIT)
- **Lane**: lite
- **Change risk**: R2 (the one place tenant code runs)

## Clarifications

- Limits (time, memory, output) and the allowed origins are data the caller passes per run, read from the plan
  catalogue's automation limits and the tenant's settings (owner rule: configuration, not code). No defaults here.
- Metering: the package reports `codeMs` on every run, success or refusal; the caller records `automation.code_ms`.
  No metering port exists in Stackra yet, and the caller already holds the scope.
- The code is JavaScript, the body of an async function of `input`. TypeScript is compiled before the step is stored.
- The audit of network calls is the proxy driver's job (the host's egress); the package enforces the allow-list.

## Requirements

- **FR-001**: The member exists in the v3.1 package shape with entries `.` and `./contracts`.
- **FR-002**: `Sandbox.run` runs the code in a fresh QuickJS-WASM runtime with JSON input and output (d2, d7).
- **FR-003**: The guest has no filesystem, process, module loader or timers (d4).
- **FR-004**: `fetch` reaches only allow-listed origins, through the `SandboxFetchProxy` port, with the run's reference
  and an abort signal (d5).
- **FR-005**: Time, memory and output are limited per run; passing one refuses `sandbox_limit_exceeded` naming it (d6).
- **FR-006**: Every run reports its milliseconds for `automation.code_ms` (d8).
- **FR-007**: A compile error, a throw or a non-JSON result refuses `sandbox_code_failed` with the code's error and logs.

## Success criteria

- **SC-001**: Every public symbol has a test in `src/**/__tests__/`; each barrel's exports are pinned.
- **SC-002**: The package's tests, typecheck and build pass in the testing workflow (not run in owner mode).
- **SC-003**: No tier value, origin or provider is a constant in the package.

## Open items

- Pyodide (Python) engine of ADR 0154 d2: not in the row; later.
- The worker pool around `Sandbox` (process isolation, concurrency) belongs to the OS service that runs automations.
