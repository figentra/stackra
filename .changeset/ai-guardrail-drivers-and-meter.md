---
"@stackra/ai": minor
---

Guardrail drivers and the AI token meter. `PatternGuardrailDriver` (configured patterns), `PiiGuardrailDriver`
(contact rules plus the Market's national ID formats from `@stackra/validation`), `InjectionGuardrailDriver` (weighted
signals and hidden characters) and `ClassifierGuardrailDriver` (a routed model picking a label) each block, redact or
flag per stage (`GuardrailEffect`, `GuardrailStages`). `GuardrailVerdict` may now carry the redacted `text` and
`flags`, and `runGuardrails` hands redacted text to the next layer and answers `{ pass: true, text, flags }`.
`AiMeter` writes `usage.recorded` on `ai.tokens` (input and output, model as subject, scope) for entitlement limits.
