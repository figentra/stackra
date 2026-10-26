# Feature Specification: AI agent runtime, conversations and ai tables

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-781

**Clarifications status**: complete

**Input**: The `Agent` and `Promptable` runtime (prompt, stream, queue, resume), the conversation store, the ADR 0100
d10 tables as models and migrations, a `./node` entry and a tenant-key encryption cast; decide where storage lives.

## Impact

- **Apps touched**: none
- **Services touched**: none (the ai service binds the ports)
- **Packages touched**: packages/application/ai
- **Cross-service events**: none
- **Tenancy and data**: eight tenant-owned tables under the equality policy; message text sealed with the tenant key
- **Secrets**: none (keys through `FieldCipher` and `KeyProvider`)
- **ADR needed**: yes, 0399 (Proposed): storage lives in `@stackra/ai/node`
- **New dependencies**: `@stackra/database`, `@stackra/model`, `@stackra/tenancy`, `@stackra/errors` (all
  `workspace:*`); lockfile not updated (owner mode)
- **Deploy modes**: same everywhere
- **Lane**: full
- **Change risk**: R2

## Requirements

- **FR-001** `./contracts`: `ConversationStore`, `RunStore`, `ToolDispatcher`, `AgentModels`, `InstructionSource`,
  `AgentQueue`; `RunStatus`, `ToolCallOutcome`, `RunApprovalStatus`; the exchanged records.
- **FR-002** `Agent({ key, task, tools, maxSteps })` over `Promptable` (prompt, stream, queue, resume); `AgentRuntime`
  on AI SDK with tool calls as action dispatches (`runId:toolCallId`), park on approval, resume.
- **FR-003** Memory drivers of both stores in `.`; Postgres drivers, the eight models, the first migration and
  `TenantKeyCast` in `./node`.

## Not built here

- A2A and the MCP gateway; the ai service's `ToolDispatcher`, `AgentModels`, `InstructionSource` and `AgentQueue`
  drivers.
- The three integration events of ADR 0100 d11.
- Tests, typecheck and build are written but not run (owner mode).
