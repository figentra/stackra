---
name: ai-mcp-tools
description: Expose Stackra capabilities to AI agents - which queries become MCP tools automatically, opting writes in with @AsTool, risk levels and human approval, intents for the command palette and AI triggers, @ContextProvider facts, defineSkill and definePrompts, plans that run as workflows, and the entitlement refusal. Use when an action or query should be callable by an agent, or when building agent-facing context, skills or prompts.
---

# AI and MCP tools

AI and MCP are in every package and service from the start, and all of it is free code (ADR 0155). An agent is a
principal: it acts through the same actions, the same pipeline and the same permissions as a human, as an `agent` actor
`onBehalfOf` the user (ADR 0098). Tools are **generated** from actions, never hand-written (ADR 0245). Shapes follow the
ADRs; `@stackra/ai` docs win once it ships.

## What becomes a tool (ADR 0155)

| Declaration                         | MCP exposure                                                        |
| ----------------------------------- | ------------------------------------------------------------------- |
| `@Query` at risk L0 or L1           | A tool automatically, under the caller's own permissions            |
| `@Action` (any write)               | Only with `@AsTool`                                                 |
| Any action at L3 or above           | Always needs a named human approval, even as a tool                 |
| Plan steps at L2 and above          | The user approves the plan before it runs (ADR 0245)                |

One MCP gateway in the `ai` service serves one server per tenant over Streamable HTTP, authenticates with OAuth through
ZITADEL, filters tools by IAM and entitlements, and audits each call. A tenant that is not entitled gets
`entitlement_required` with an upgrade path, not a missing tool.

## Worked example

```ts
@Query({
  key: "billing.invoice.list@1",
  input: ListInvoicesInput, output: ListInvoicesOutput,
  permission: "billing.invoice.read", risk: "L0",
  actors: ["user", "agent", "service"],
  intents: ["show unpaid invoices", "which invoices are overdue"],   // the intent router and command palette
  description: "Lists invoices visible to the caller, newest first, cursor-paginated.", // the tool description
})
export class ListInvoicesQuery { /* ... */ }

@Action({ key: "billing.invoice.refund@1", risk: "L3", actors: ["user", "agent"], /* ... */ })
@AsTool()          // opt in; L3 means a human approves each call
export class RefundInvoiceAction { /* ... */ }
```

Write tool descriptions for a model: what it does, what it returns, when not to use it. Inputs are the action's Zod
schema, so field descriptions on the schema reach the model.

## Context, skills, prompts (ADR 0245)

```ts
@ContextProvider({ key: "billing.invoice-context", for: "record:billing.invoice" })
export class InvoiceContext {
  async provide(invoiceId: string, ctx: ContextRequest) { /* facts about one record, permission-checked */ }
}

export const REFUNDS_SKILL = defineSkill({
  key: "billing.refunds",
  instructions: "billing::ai/refunds.md",        // loaded on demand: progressive disclosure
  tools: ["billing.invoice.list@1", "billing.invoice.refund@1"],
  examples: [/* input → expected tool calls */],
});

export const BILLING_PROMPTS = definePrompts("billing", { "explain-invoice": { version: 1, template: "billing::ai/explain.md" } });
```

- A **plan** is a list of actions with inputs that an agent proposes; it runs as an ephemeral workflow (ADR 0152);
  the runner refuses a step the approving user lacks permission for.
- Guardrails (ADR 0156): tool and retrieved content are untrusted; no injected tool chaining; confirmation for L2+
  writes; allow-listed URLs; personal data redacted for third-party models where configured; budgets per tenant, agent
  and user.

## Never

- A hand-written MCP tool or a tool that bypasses an action.
- A tool that reads tenant or user identity from its input.
- A secret or credential visible to the model; credentials are secret refs resolved by the runtime (ADR 0267, 0107).
- Asking in a spec "does this need AI?": the answer is always yes (ADR 0155).

## Check

`pnpm --filter <member> test`, then `pnpm verify`. Review: `api-contract-reviewer`, and `security-tenancy-reviewer` for
any tool at L2 or above.
