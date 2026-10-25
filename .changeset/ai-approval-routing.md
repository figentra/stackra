---
"@stackra/ai": minor
---

Add the approval-mode resolver of ADR 0360 (`resolveApproval` with `ApprovalMode`, in the fixed order IAM,
entitlement, environment, floor, organisation, user, level; the floor is data), the model router by task, region and
data class with tenant overrides and disclosed fallbacks (`routeModel`, `resolveModel`, `ModelProviderDriver`), the
field allow-list per data class and redaction rules (`allowFields`, `redact`), the token budget check (`checkBudget`),
layered guardrails (`runGuardrails`, `Guardrail`), eval runs (`runEvals`) and the intent router (`routeIntent`).
