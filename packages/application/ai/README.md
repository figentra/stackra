<!--
Stackra file contract:
Purpose: the README of @stackra/ai: the AI kinds, the tool-table vocabulary, decide and retrieve, approvals, routing, guardrails and their drivers, the token meter, the agent runtime, the page reader and the events.
Boundary: documentation only; the rules for agents are in AGENTS.md.
Runtime: none (Markdown)
Governing contract: ADR 0100, ADR 0155, ADR 0156, ADR 0216, ADR 0294, ADR 0360, ADR 0399; ADR 0450; STA-1377.
-->

# @stackra/ai

The AI kinds of a module's `ai/` group and the vocabulary of the MCP tool table gen writes, plus `decide()`, one
typed answer from a model on AI SDK core. All of it is free code (ADR 0155). Tools are never written here: a query is
an MCP tool by default and an action with `tool: true` (both from `@stackra/actions`); gen derives the tool table, and
the one MCP gateway in the `ai` service serves it.

**Tier:** `tier:lib` (`packages/application/ai`). One entry, `.`. Depends on `@stackra/actions` (types, and `UsageRecorded` for the meter),
`@stackra/container`, `@stackra/contracts`, `@stackra/search` (ports), AI SDK core (`ai`) and zod.

## What is here

| Symbol                                                                         | Use                                                                                                         |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `Prompt`, `Prompt({ version })`                                                | kind base of a versioned MCP prompt in `ai/<name>.prompt.ts`                                                |
| `Skill({ tools })`                                                             | kind base of an agent skill in `ai/<name>.skill.ts`; `examples` field typed `SkillExample`                  |
| `Facts<M>`                                                                     | kind base of the facts about one record in `ai/<name>.facts.ts`; `provide(id, ctx)`                         |
| `FactsContext`, `ContextFacts`                                                 | types: `provide`'s context (`actor`, `locale`, `authorize`, `money`) and result                             |
| `ToolSource`                                                                   | `Query`, `Action`: what a tool row of `#stackra/ai` projects                                                |
| `Approval`, `approvalFor(risk)`                                                | `Confirm` (L2), `NamedApprover` (L3, L4): the default human gate of an agent's call                         |
| `retrieve(query, { index, embedder, topK, scope })`                            | top-k passages (`text`, `source`, `score`) for a `Facts` class, over the `VectorIndex` and `Embedder` ports |
| `decide({ model, prompt, ... })`                                               | one of `choices`, a `score` in a range, or `yesNo` as a boolean, typed                                      |
| `PromptClass`, `SkillClass`, ...                                               | types: the class types and options of the kinds above                                                       |
| `resolveApproval(request, { floor, policy, preferences })`                     | the approval-mode resolver of ADR 0360 in its fixed order; `ApprovalMode` names the deciding mode           |
| `routeModel(request, table)`, `resolveModel(choice, drivers)`                  | the model router by task, region and data class, and the bound provider driver's model instance             |
| `allowFields(facts, dataClass, allowList)`, `redact(text, rules)`              | the field allow-list per data class and the redaction rules, before context reaches a model                 |
| `checkBudget(used, requested, budget)`                                         | the meter check: refuse a run over its token budget, warn at the budget's share                             |
| `GuardrailBlockedError`                                                        | the 403 refusal (`guardrail_blocked`) `AgentRuntime` raises when a layer blocks a prompt or an answer       |
| `runGuardrails(layers, text, stage)`                                           | the layered guardrail check: redactions pass on, flags collect, the first block wins                        |
| `PatternGuardrailDriver`, `PiiGuardrailDriver`                                 | guardrail layers over configured patterns, and over contact rules plus the Market's national ID formats     |
| `InjectionGuardrailDriver`, `ClassifierGuardrailDriver`                        | the prompt-injection heuristic (weighted signals, hidden characters) and a routed model picking a label     |
| `GuardrailLayer`, `GuardrailEffect`, `GuardrailStages`                         | the port the drivers extend; `block`, `redact` or `flag` per stage (`input`, `output`), as settings data    |
| `AiMeter`, `AI_METERS`, `AiUsage`                                              | `usage.recorded` on `ai.tokens` per direction, with the model and scope, for entitlement limits             |
| `runEvals(cases, subject)`                                                     | an eval suite run, for CI on AI SDK's mock or recorded models                                               |
| `routeIntent(text, intents, { model })`                                        | the intent router: a phrase match, else one `decide` among the keys                                         |
| `PageReader` (`./contracts`), `MemoryPageReaderDriver`, `HttpPageReaderDriver` | read one URL into text and product hints (ADR 0450)                                                         |
| `checkEgress(url, policy)`, `parsePage(html, baseUrl, maxChars)`               | the page reader's egress check and its HTML extraction, shared by both drivers                              |
| `A2aDirection` (`./contracts`)                                                 | `inbound` or `outbound`: the direction of an `A2aTask` row                                                  |
| `ApprovalRequested`, `ApprovalResolved`, `RunCompleted`                        | the three integration events of ADR 0100 decision 11 (`ai.approval.requested.v1` and the others)            |

## Retrieval for Facts

`retrieve` is the vector/RAG helper (owner decision 23), not a tool source: it embeds the query with the `Embedder`, asks
the `VectorIndex` (both from `@stackra/search/contracts`) for the top-k hits in the caller's scope, and returns
`RetrievedPassage`s. A `Facts` subclass injects the two ports and returns the passages from `provide`.

**One vector store (ADR 0465).** Every embedding lives in `search.vector_items` behind `VectorIndex`; this package
keeps no vector table. Migration `ai.0002_drop_embeddings` drops `ai.embeddings` and the `Embedding` model is gone
(nothing ever wrote it). Conversation memory, when it lands, upserts through `VectorIndex` with
`{ conversationId, messageId, embedder, contentHash }` as item metadata and the caller's scope; the message text stays
sealed in `ai.messages`, so a memory item's `text` is the passage the model may see back, nothing more.

```ts
export class ArticleFacts extends Facts<Article> {
  constructor(index: VectorIndex, embedder: Embedder) {
    super();
    this.index = index;
    this.embedder = embedder;
  }

  async provide(articleId: Article["id"], ctx: FactsContext): Promise<ContextFacts> {
    const passages = await retrieve(question, {
      index: this.index,
      embedder: this.embedder,
      topK: 4,
      scope,
    });
    return { summary: `${passages.length} passages match.`, facts: { passages } };
  }
}
```

The scope is the caller's own, never request input; `source` is the passage's `source` metadata, else its id.

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

## Approval modes

`resolveApproval` decides one agent tool call in the fixed order of ADR 0360: IAM, entitlement and flag, the live
environment (a structural change on live is refused: it goes through a sandbox), the floor, the organisation's policy,
the user's preferences, then the default by level.

```ts
import { resolveApproval } from "@stackra/ai";

const decision = resolveApproval(
  { action: "orders.order.refund@1", risk: "L2", tags: ["financial"], permitted, entitled },
  { floor, policy, preferences },
);
// { outcome: "named_approver", step: "floor" }
```

- The floor is data: `settings:platform-floor:*` and the market pack give its tags, tag sets (`external-communication`
  with `bulk`), recipient limit and the agent-delete rule. The resolver holds only the check.
- A floor hit or L3 and L4 always need a named human; the organisation may escalate it to another human, nothing
  relaxes it. Below the floor the organisation tightens first (`escalate`, `ask`), L0 and L1 run at once, then allow
  by default, always allow, and a bypass session where the organisation allows bypass.
- The session's switch reaches the gate on every tool call: pass `bypass: true` in the `PromptCall` (or the
  `ResumeDecision` of a resume) and `AgentRuntime` sets `ToolCallContext.bypass`. A queued run has no session, so its
  calls carry none.

## Model routing

`routeModel` picks the first row for the task, the tenant's own rows (its keys) before the product's, that the data
class allows and that serves the tenant's region; otherwise a fallback jurisdiction of the region's rule, disclosed,
skipping those that need an opt-in the tenant did not give. A strict tenant, or a data class marked in-region only,
never falls back; a class whose enabled providers list is empty is closed. The table, the regions and the classes are
data. `resolveModel` hands the choice to the bound `ModelProviderDriver`, which resolves its own credentials.

The bound drivers are collected behind the `ModelProviders` port (`ai.ModelProviders`): the ai service binds a driver
that lists them, and its `AgentModels` driver calls `resolveModel(choice, container.get(ModelProviders).drivers())`.
Only the token is here; the Bedrock and Anthropic drivers are the ai service's.

Context reaches the model through `allowFields` (a field allow-list per data class, deny by default) and `redact`
(contact details, document numbers and card numbers, with patterns from the market pack and the platform floor).

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

## Guardrails

`runGuardrails(layers, text, stage)` runs each layer on the text the layer before it let through. A layer answers
pass, pass with the text redacted, pass with flags, or block. The result is the text the model may see and every flag
with its layer, or the first block. Each driver takes its effect per stage (`GuardrailEffect`: `block`, `redact` or
`flag`) and all its patterns as settings or market-pack data; none is written in code. Every driver extends
`Driver(GuardrailLayer)`; a service's own layer may extend it too, or be any object of the `Guardrail` shape.
Each driver's options (`PatternGuardrailOptions`, `PiiGuardrailOptions`, `InjectionGuardrailOptions`,
`ClassifierGuardrailOptions`) are runtime class tokens: pass an object literal when you construct a layer, or bind
the token with `useValue` when the container builds it.

`AgentRuntime` runs every bound `GuardrailLayer` (`DiscoveryService.getAll`, wiring order) on the prompt before it is
stored and on the final answer before it is stored: a redaction is what the conversation keeps and the reply carries,
and a block throws `GuardrailBlockedError` (a blocked prompt opens no run; a blocked answer fails the run with
`guardrail_blocked`). A stream's `textStream` has already shown the unredacted answer; only its `reply` is checked.

```ts
const layers = [
  new InjectionGuardrailDriver({
    ...settings.ai.injection,
    stages: { input: GuardrailEffect.Block },
  }),
  new PiiGuardrailDriver({
    rules: floor.redaction, // emails, phones, cards
    nationalIds: NationalIdFormats$.parse(valueOf(pack, "identity.national_ids", today)?.value),
    stages: { input: GuardrailEffect.Redact, output: GuardrailEffect.Redact },
  }),
  new PatternGuardrailDriver({
    rules: settings.ai.denylist,
    stages: { output: GuardrailEffect.Block },
  }),
  new ClassifierGuardrailDriver(providers, {
    ...settings.ai.policy,
    route,
    stages: { output: GuardrailEffect.Flag },
  }),
];
const checked = await runGuardrails(layers, reading.text, "input");
if (!checked.pass) return refuse(checked.guardrail, checked.reason);
send(checked.text);
```

| Driver                      | Catches                                                                                       | Effects             |
| --------------------------- | --------------------------------------------------------------------------------------------- | ------------------- |
| `PatternGuardrailDriver`    | any configured `RedactionRule` (denylists, banned phrases, Arabic word lists)                 | block, redact, flag |
| `PiiGuardrailDriver`        | contact rules, and numbers that pass one of the Market's `IdentifierFormat`s and check digits | block, redact, flag |
| `InjectionGuardrailDriver`  | weighted `InjectionSignal`s plus hidden characters, from a threshold                          | block, redact, flag |
| `ClassifierGuardrailDriver` | a model, routed through `ModelProviders`, choosing a label outside the allowed ones           | block, flag         |

Reasons and flags are rule names, document kinds and labels, never the caught text. Put the PII layer before the
classifier when the classifier's model is a third party's. The injection heuristic lowers risk; the tool approval floor
stays the control.

## Token meter

`AiMeter.tokens(usage, { reference, model, scopeId, actor })` writes one `usage.recorded` (`@stackra/actions`) per
direction through the outbox: meter `ai.tokens`, kind `sum`, key `ai.tokens.input` or `ai.tokens.output`, the model as
`subject`, the run or call id as `callId`. An entitlement limit on `ai.tokens` caps a scope's AI spend; prices per
model are rate-card data. `AgentRuntime` calls it with each settled loop's summed usage (the run id as reference, the
routed model as `<provider>/<model>`, the run's scope and actor); a service that calls a model outside the runtime
calls it with AI SDK's `usage` itself.

## Page reader

`PageReader` (`ai.PageReader`, ADR 0450) reads one web page: `read(url)` returns the `PageReading` (final URL, status,
title, language, readable text cut at the policy's limit, and `ProductHint`s from schema.org `Product` JSON-LD) or a
`PageReadRefusal` code. It does not crawl, run scripts, send cookies or store anything.

```ts
const pages = HttpPageReaderDriver.within(settings.pageReader, egressFetch);
const result = await pages.read("https://shop.example.com/products/abaya");
if (result.ok) draft(result.page.products); // [{ name: "Black Abaya", price: "129.00", currency: "SAR", ... }]
```

- Every URL and redirect target passes `checkEgress`: https, the default port, no credentials, a public host name
  (no IP literal, `localhost`, single label or private suffix), then the policy's deny and allow lists.
- `PageReaderPolicy` (`maxBytes`, `timeoutMs`, `maxRedirects`, `maxTextChars`, `userAgent`, `allowHosts`, `denyHosts`)
  comes from settings; nothing here sets a default. The check reads the URL only, so the service passes a fetch that
  goes through its egress proxy, which cannot reach private addresses.
- A reading is untrusted: hand it to a model as data, under the guardrails.
- `MemoryPageReaderDriver.of({ [url]: html })` serves tests and evals through the same `parsePage`.

## Events

ADR 0100 decision 11 allows three integration events and no others. `PostgresRunStoreDriver` (`./node`) records each on
the row that changes, so the outbox writes it in the same flush: `ApprovalRequested` on the run as it parks on a gated
tool call, `ApprovalResolved` on the approval as it is granted or denied, and `RunCompleted` on the run as it completes
or fails (with its steps and a failure's code). None carries prompt, response or tool input text. The memory store
records none: it has no outbox.

## Not here

The MCP gateway, conversations, runs, approvals storage (the `ai_*` tables of ADR 0100 decision 10) and the provider
routing table's rows are the `ai` service's (ADR 0155 decision 4, ADR 0156); the router, the resolver and the checks
they run are here. Intents are the `intent` option of an action or query; plans run as workflows
(`@stackra/workflow`); the `entitlement_required` refusal is `@stackra/entitlements`'. The local developer MCP is
`@stackra/mcp`.
