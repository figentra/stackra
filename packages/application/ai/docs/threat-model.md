# Threat model: @stackra/ai

<!--
Stackra file contract:
Purpose: the threat model of @stackra/ai: agent tool calls and their approvals, model routing by region and data class,
         field allow-lists and redaction, guardrails, the token meter, retrieval, the page reader and conversation
         erasure.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC5 and SEC10; ADR 0021; ADR 0100; ADR 0155; ADR 0216; ADR 0360; ADR 0450; ADR 0490;
                    ADR 0207 (amendment of 2026-11-26: the ASVS level); STA-316.
-->

ASVS level: L1 for every chapter (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

Every AI tool call is an action under the caller's own permissions, and a write needs a human in the loop by its risk.
This package holds the vocabulary, the approval resolver, model routing, guardrails, the meter and the page reader;
the MCP gateway in the `ai` service serves the tools. Its threats are an agent doing more than its user may, data sent
to a model it should not reach, and untrusted text steering the agent.

## Assets

| Asset                                  | Where it lives                                             | Class      |
| -------------------------------------- | ---------------------------------------------------------- | ---------- |
| Prompts and context facts              | memory for one call; facts are what the principal may read | `pii`      |
| Conversations and messages             | `ConversationStore` (`ai.messages`, append-only)           | `pii`      |
| Model provider credentials             | the bound `ModelProviderDriver`, through the secret store  | `secret`   |
| The routing table and data-class rules | settings and market-pack data                              | `internal` |
| Token usage per scope                  | `usage.recorded` events on `ai.tokens`                     | `internal` |

## Trust boundaries

1. A user or an MCP host to the agent, through the gateway's tool table.
2. The agent's tool call to the action pipeline, under the caller's actor chain.
3. This package to model providers (in region or a disclosed fallback).
4. The page reader to the public web; retrieved pages, records and messages back into a prompt.

## Threats and controls

| Threat                                               | Control today                                                                                                                                                | Open work                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| An agent does what its user may not                  | Every tool is an action or query run through the pipeline with the caller's actor chain; every link must hold the permission                                 | —                                            |
| An agent moves money or deletes on its own           | `approvalFor`: L2 confirms, L3 and L4 need a named human and are never turned off; floor tags force a named approver; no structural change on live           | —                                            |
| Prompt injection through a page, record or message   | Retrieved text is handed to the model as data; layered guardrails with an injection heuristic and a classifier; approvals bound what an injected call can do | Guardrail evaluation sets in CI (`runEvals`) |
| Personal data reaches a model that should not see it | `allowFields` per data class, `redact` rules and the PII guardrail before a model; routing by region and data class; in-region-only classes never fall back  | One classification source, STA-1421          |
| A model answer carries data or instructions out      | Output-stage guardrails (`block`, `redact`, `flag`)                                                                                                          | —                                            |
| The page reader is pointed at internal hosts (SSRF)  | `checkEgress` on every URL and redirect: https, default port, no credentials, a public host name; size, time and redirect limits; the host's egress proxy    | —                                            |
| Runaway token spend                                  | `checkBudget` refuses a run over its budget; quota entitlements on the `ai.tokens` meter                                                                     | —                                            |
| A forgotten person's conversations stay              | `ConversationStore.forget(principalId)` under the caller's scope; held messages stay                                                                         | —                                            |
| Retrieval returns another scope's passages           | `retrieve` asks the vector index in the caller's own scope, never a scope from input                                                                         | —                                            |
