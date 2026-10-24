# @stackra/ai

The AI kinds of a module's `ai/` group and the vocabulary of the MCP tool table gen writes, plus `decide()`, one
typed answer from a model on AI SDK core. All of it is free code (ADR 0155). Tools are never written here: a query is
an MCP tool by default and an action with `tool: true` (both from `@stackra/actions`); gen derives the tool table, and
the one MCP gateway in the `ai` service serves it.

**Tier:** `tier:lib` (`packages/application/ai`). One entry, `.`. Depends on `@stackra/actions` (types),
`@stackra/container`, `@stackra/contracts`, AI SDK core (`ai`) and zod.

## What is here

| Symbol                           | Use                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `Prompt`, `Prompt({ version })`  | kind base of a versioned MCP prompt in `ai/<name>.prompt.ts`                               |
| `Skill({ tools })`               | kind base of an agent skill in `ai/<name>.skill.ts`; `examples` field typed `SkillExample` |
| `Facts<M>`                       | kind base of the facts about one record in `ai/<name>.facts.ts`; `provide(id, ctx)`        |
| `FactsContext`, `ContextFacts`   | types: `provide`'s context (`actor`, `locale`, `authorize`, `money`) and result            |
| `ToolSource`                     | `Query`, `Action`: what a tool row of `#stackra/ai` projects                               |
| `Approval`, `approvalFor(risk)`  | `Confirm` (L2), `NamedApprover` (L3, L4): the default human gate of an agent's call        |
| `decide({ model, prompt, ... })` | one of `choices`, a `score` in a range, or `yesNo` as a boolean, typed                     |
| `PromptClass`, `SkillClass`, ... | types: the class types and options of the kinds above                                      |

## A module's `ai/` group

```ts
// ai/explain-order.prompt.ts: template orders::ai/explain-order.md, evaluations orders::ai/explain-order.eval.json,
// arguments ExplainOrderInput in schemas/; all bound by name
export class ExplainOrderPrompt extends Prompt {}

// ai/orders-support.skill.ts: instructions orders::ai/orders-support.md
export class OrdersSupportSkill extends Skill({
  tools: [GetOrderQuery, ListOrdersQuery, CancelOrderAction],
}) {
  readonly examples = [
    {
      input: "cancel my last order",
      calls: [
        { tool: ListOrdersQuery, input: { limit: 1 } },
        { tool: CancelOrderAction, input: { orderId: "$0.items[0].id" } },
      ],
    },
  ];
}

// ai/order.facts.ts: attached when a conversation names an `ord_` id
export class OrderFacts extends Facts<Order> {
  constructor(orders: OrderService) {
    super();
    this.orders = orders;
  }

  async provide(orderId: Order["id"], ctx: FactsContext): Promise<ContextFacts> {
    const order = await this.orders.findOneOrFail({ id: orderId });
    await ctx.authorize(order);
    const view = this.orders.toView(order);
    return { summary: `Order ${view.id} is ${view.status}.`, facts: { ...view } };
  }
}
```

`Skill({ tools })` throws a `TypeError` for a class that is not an exposed tool (a query with `tool: false`, an action
without `tool: true`) and for a tool listed twice. A tool's risk is its permission's; gen checks it.

## Approvals

| Permission risk | `approvalFor`   | Meaning                                                                     |
| --------------- | --------------- | --------------------------------------------------------------------------- |
| L0, L1          | `undefined`     | runs at once, under the caller's own permissions                            |
| L2              | `Confirm`       | the person the agent acts for confirms; settings may turn it off per action |
| L3, L4          | `NamedApprover` | a named human approves each call; never turned off                          |

## decide

```ts
import { decide } from "@stackra/ai";

const route = await decide({
  model,
  prompt: `Route: ${text}`,
  choices: ["billing", "orders", "other"],
});
//    ^? "billing" | "orders" | "other"
const urgency = await decide({ model, prompt: `How urgent? ${text}`, score: { min: 1, max: 5 } });
const isComplaint = await decide({ model, prompt: `Is this a complaint? ${text}`, yesNo: true });
```

`model` is a provider model instance the service built (Bedrock through its cloud role, or a provider whose key is a
secret name resolved at run time). A model id string is refused: AI SDK would resolve it through its hosted gateway,
an LLM proxy ADR 0155 rules out. An answer outside the choices or the range rejects with AI SDK's
`NoObjectGeneratedError`.

## Not here

The MCP gateway, conversations, runs, approvals storage and the provider routing table are the `ai` service's (ADR
0155 decision 4, ADR 0156). Intents are the `intent` option of an action or query; plans run as workflows
(`@stackra/workflow`); the `entitlement_required` refusal is `@stackra/entitlements`'. The local developer MCP is
`@stackra/mcp`.
