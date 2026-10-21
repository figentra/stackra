---
name: backend-author-an-action
description: Write a Stackra action or query - @Action or @Query with key@version, Zod input and output, permission, risk, actors, handle(input, ctx), one transaction, events through the outbox, idempotency, refusal codes, the UX declaration and the adapters that expose it (@AsEndpoint, @AsTool, @AsJob, @AsListener). Use whenever a service or package adds or changes behaviour, an endpoint, an MCP tool, a job or an event handler.
---

# Author an action

Behaviour in Stackra is an **action** (ADR 0098). One declaration drives REST, MCP, the CLI, jobs, the console and the
generated clients (ADR 0217); `stackra gen` emits the Encore adapters (ADR 0091). You never write `api()`, a controller
for business behaviour, or an HTTP response by hand.

The shapes below follow the ADRs. Once `@stackra/actions` ships, its API docs are authoritative where they differ.

## Decide first

| Question                                   | Answer                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| Does it change state?                      | Yes: `@Action`. No: `@Query` (no transaction, ADR 0136).                                 |
| Several steps, waits, compensation?        | Still one action key; a `@Workflow` sits behind it only when the 0101 criteria hit.     |
| Risk (ADR 0099)                            | L0 read, L1 own-data write, L2 others' data, L3 money/permissions/bulk, L4 irreversible. |
| Who may call it?                           | `actors: ['user', 'agent', 'service', ...]`; any other actor type is refused.          |
| Exposed how?                               | Adapters: `@AsEndpoint`, `@AsTool`, `@AsCommand`, `@AsJob`.               |

## Worked example: refund an invoice

```ts
// src/modules/billing/actions/refund-invoice.action.ts
import { Action, AsEndpoint, AsTool, type ActionContext } from "@stackra/actions";
import { InvoiceService } from "#modules/billing/services/invoice.service";
import { RefundInvoiceInput, RefundInvoiceOutput } from "#modules/billing/contracts/refund-invoice.contract";

@Action({
  key: "billing.invoice.refund@1",          // <module>.<resource>.<verb>@<version> (ADR 0231)
  input: RefundInvoiceInput,                 // Zod (ADR 0095)
  output: RefundInvoiceOutput,
  permission: "billing.invoice.refund",      // from the module's definePermissions (ADR 0132)
  risk: "L3",                                // money
  actors: ["user", "agent"],
  approval: { above: { amountMinor: 100_000 } },
  rateLimit: { perMinute: 10 },              // declared option, run by the pipeline (ADR 0137)
  intents: ["refund invoice INV-1042", "give the customer their money back"],
  ux: {                                      // ADR 0139: one declaration for web, native and AI
    requiresConfirmation: { text: "billing::invoice.refund_confirm", color: "danger" },
    success: "billing::invoice.refunded",
    after: ["refresh"],
  },
})
@AsEndpoint({ method: "POST", path: "/invoices/:invoiceId/refunds" })
@AsTool() // writes are tools only when they opt in (ADR 0155)
export class RefundInvoiceAction {
  constructor(private readonly invoices: InvoiceService) {}

  async handle(input: RefundInvoiceInput, ctx: ActionContext): Promise<RefundInvoiceOutput> {
    const invoice = await this.invoices.findForRefund(input.invoiceId); // scoped to ctx's tenant by the pipeline
    const refund = await this.invoices.refund(invoice, input.amountMinor, ctx.now());
    ctx.emit("billing.invoice.refunded.v1", { invoiceId: invoice.id, refundId: refund.id });
    ctx.afterCommit(() => this.invoices.notifyProvider(refund)); // network only after commit
    return { refundId: refund.id, status: refund.status };
  }
}
```

```ts
// src/modules/billing/contracts/refund-invoice.contract.ts
import { z } from "zod";
export const RefundInvoiceInput = z.object({
  invoiceId: z.string(),                 // public id, inv_<26>, validated before lookup (ADR 0135)
  amountMinor: z.number().int().positive(),
  reason: z.string().max(500).optional(),
});
export type RefundInvoiceInput = z.infer<typeof RefundInvoiceInput>;
```

## What the pipeline does for you (ADR 0098, 0138)

actor → validate → tenancy → iam → policy → entitlement → budget → approval → idempotency → transaction → handle →
outbox → evidence → audit. Do not re-implement any step in `handle()`:

- **Tenant and actor** come from `ctx`, never from the input (ADR 0136).
- **Idempotency**: client writes require `Idempotency-Key`; the SDKs send it; a reused key with a different payload is
  `409`. Never store keys yourself.
- **Transaction**: one per action; events go through the outbox inside it; `ctx.afterCommit` for external calls. A lint
  flags network calls inside `handle()`.
- **Refusals** are returned with stable snake_case codes: `module_disabled`, `entitlement_missing`, `flag_off`,
  `consent_missing`, `rate_limited`, `region_unsupported`, `maintenance`, `step_up_required`, `limit_exceeded` (ADR 0137).

## Errors

Throw a `StackraError` subclass with a category and a snake_case code (skill `backend-errors`, ADR 0140, 0232). The
transport mapping (HTTP status, MCP error, CLI exit code) is generated from the category.

## Versions

A breaking change is a new `key@2` beside `@1`; public versions get a deprecation with a sunset of at least six months
(ADR 0131, 0136). Never change the shape of a published version.

## Queries and MCP

```ts
@Query({ key: "billing.invoice.list@1", input: ListInvoicesInput, output: ListInvoicesOutput,
         permission: "billing.invoice.read", risk: "L0", actors: ["user", "agent", "service"] })
@AsEndpoint({ method: "GET", path: "/invoices" })
export class ListInvoicesQuery { /* cursor pagination, capped limit, allow-listed sorts */ }
```

An L0 or L1 query is an MCP tool automatically, under the caller's own permissions; L3 and above always need a named
human (ADR 0155). See the skill `ai-mcp-tools`.

## Never

- `api()`, `encore.service.ts`, `APIError`, or any Encore import in a member (ADR 0124).
- A controller for business behaviour; `@Controller` is only for raw endpoints (webhooks, `/api/auth/*`, streaming).
- Reading tenant, actor or user id from the body, query or a client header.
- An action without a permission, a risk level or `actors`: gen rejects it (ADR 0098 enforcement).

## Check

`pnpm --filter <member> test typecheck build`, then `pnpm verify`. Review: `api-contract-reviewer`.
