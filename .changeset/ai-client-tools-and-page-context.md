---
"@stackra/ai": minor
---

Add client tools and page context (STA-1631, ADR 0490): `ToolSource.Client`, the `ClientToolKind` and `SurfaceKind`
enums, the `ClientToolRow`, `ClientToolTable`, `SurfaceDescriptor`, `ClientToolPart`, `ClientToolAnswer` and
`ClientToolPending` types, `offerClientTools`, and `PromptCall.surface`, `clientTools` and `onClientTool`.
`AgentRuntime` parks a run on a client tool call (`RunStatus.WaitingClientTool`, `RunRecord.clientPending`), emits the
part to that surface only, and resumes through `resolveClientTool` or, after 30 seconds, `expireClientTool`
(`client_unavailable`); a repeat answer is refused with `ClientToolNotPendingError`. Adds the `ClientResultInput`
schema with `CLIENT_RESULT_ACTION` (`PUT /runs/:runId/client-result`), the `PageContext` schema and
`resolvePageContext` (unreadable ids dropped, `Facts` lookups, field allow-list, token budget), and migration 0004
(three nullable park columns on `ai.runs`; the run status and tool call outcome checks widened). The `ToolSource`
docblock now states the ADR 0360 decision 4 default.
