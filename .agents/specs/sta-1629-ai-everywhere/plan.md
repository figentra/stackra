# Plan: AI everywhere

**Input**: `.agents/specs/sta-1629-ai-everywhere/spec.md`; ADRs 0490, 0491, 0492.

## Order

Everything is day one; the order only follows what each lane consumes.

| Wave | Lanes                                                     | Why this order                                                                |
| ---- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| A    | 2 (client tools, page context), 7 (search), 8 (images)    | contracts other lanes consume; 7 and 8 are independent of the UI              |
| B    | 1 (SDK, sidekick), 3 (personalisation), 6 (payer step-up) | 1 needs lane 2's stream parts; 3 and 6 are gate and action work               |
| C    | 4 (tours), 5 (cards, chat storefront), 9 (gateway, edge)  | 4 needs client tools and the runner; 5 needs the sidekick; 9 needs OS STA-705 |

Lanes in one wave touch disjoint packages and run as parallel worktrees. Each lane is one commit (amended), handed
to the tester stackra-f4 as a bundle; nothing is pushed.

## Design notes per lane

- **Lane 2.** The client tool table is a sibling of the server tool table: same row shape (`key`, `name`, `from`,
  `risk`, input schema) with `from: client` and `risk: L0`. The runtime treats a client row as a tool whose
  `execute` parks: `RunStore` gains the park reason `client_tool` beside `approval`. The relay is the run's existing
  stream; the result route is an action so it gets idempotency and audit for free.
- **Lane 1.** The stream client is a thin adapter of `@ai-sdk/react`'s transport onto the ai service's routes and
  auth; `useClientTools` maps `client_tool` parts to the generated handlers and posts results. The sidekick contract
  lives in `@stackra/ui` contracts; web and native implementations sit in their entries.
- **Lane 3.** Actions over the existing `StoredView` model and its service; the dashboard overlay is a new model in
  panel; user settings reuse `StoredSetting` at user scope if it already supports one (checked first).
- **Lane 4.** `Tour` is a document kind next to `Dashboard`; the validator reads `#stackra/client-tools`.
- **Lane 5.** `Card` is a kind (`cards/` group in an app or module, `<name>.card.tsx`), named per ADR 0305; gen's
  `ui://` build reuses the single-file bundler that `uiResourceTable` expects.
- **Lane 6.** A new `ApprovalKind.Payer`; the gate resolves it from a provider event the payments module emits; the
  resolver refuses it for any actor that is not a customer acting on their own order.
- **Lane 7.** `SearchService.search` → fused candidates → `Reranker.rerank(query, top N)` → page. Stemmer lane as a
  new shadow version through the existing swap.
- **Lane 8.** Images follow `images/ocr`: a Dockerfile with a pinned base and packages, a small `server.py`, tests
  in `images/<name>/__tests__`. `tools-retrieval` is a catalogue entry only (no image of ours).
- **Lane 9.** Core work is contracts and runway routes; the deploy is OS's.

## Constitution check

- Tools stay generated (0155, 0245 as amended); no hand-written tool.
- Packages import no app or service; the ai service is reached through the generated client.
- No new Python outside the tools-stack images; no separate vector store; no LLM proxy gateway (0227).
- Versions only from catalogs; the two new entries wait for the owner.
