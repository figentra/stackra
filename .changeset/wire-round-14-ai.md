---
"@stackra/ai": minor
---

`AgentRuntime` meters and guards every run (STA-1385). It now takes `AiMeter` and `DiscoveryService` (two new
constructor parameters, bound by gen): each settled loop's token usage goes to `AiMeter.tokens` (run id, routed model,
scope, actor), and every bound `GuardrailLayer` checks the prompt before it is stored and the final answer before it is
stored. A redaction is what the conversation keeps; a block throws the new `GuardrailBlockedError` (403,
`guardrail_blocked`), failing the run when it is the answer.
