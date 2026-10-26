# Feature Specification: sandbox remainder (process pool, TypeScript steps, Python engine)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-720 (low priority; after launch)

**Clarifications status**: open: the Pyodide catalog entry and the `SandboxMeter` port (owner)

## Impact

- **Packages touched**: packages/runtime/sandbox (new `./node` entry)
- **ADR needed**: yes, 0434 (Proposed)
- **New dependencies**: none (Node's `child_process` and type stripping)
- **Lane**: full · **Change risk**: R2

## Requirements

- **FR-001** `SandboxPool` (open, run, close): a fixed number of child processes, one run each, a queue, fetch relayed
  over IPC to the host's `SandboxFetchProxy`, a watchdog at time limit plus grace, a dead process replaced.
- **FR-002** `serveSandboxChild`, the process body; `IpcFetchProxyDriver` inside the child.
- **FR-003** `compileTypeScriptStep`: types erased in place, code-generating syntax refused.

## Not built here

- The Pyodide engine: `pyodide` is not in the catalog (ADR 0434 decision 1). The `SandboxMeter` port (owner).
- Tests, typecheck and build are written but not run (owner mode).
