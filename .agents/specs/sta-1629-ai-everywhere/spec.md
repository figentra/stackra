# Feature Specification: AI everywhere — one tool system for the staff sidekick and the shopping assistant

**Feature Branch**: `figentra/sta-1629-ai-everywhere` (one lane branch per lane after approval)

**Created**: 2026-10-30

**Status**: Clarified

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1629 (umbrella); lanes STA-1630 to STA-1638

**Clarifications status**: complete

The owner approved the ADRs and the spec on 2026-10-30; the answers are under Owner questions.

**Input**: the leader's brief of 2026-10-30 and the owner's message of the same day (Python narrow, reranker and
hybrid search with Arabic, speech behind a port, one runtime and gateway, everything day one).

## What exists on core main (verified on 6f3536ed)

| Brief's claim                                                   | Found                                                                                                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server tools generated from queries and actions, approval modes | Yes. `ToolSource` (query, action), `AgentRuntime` (parks on approval, resumes), approval enums and floor types in `@stackra/ai`; `toolTable`, `readManifests` in `@stackra/mcp` |
| `Facts` give record context, server side                        | Yes. `packages/application/ai/src/core/bases/facts.base.ts`                                                                                                                     |
| pgvector retrieval                                              | Yes, and more: `PostgresSearchDriver` already fuses full-text, trigram and pgvector lanes by reciprocal rank; `normalizeArabic` fold; 1024-dim HNSW; `HttpEmbedderDriver`       |
| PaddleOCR with a Python server                                  | Yes. `PaddleOcrTextExtractorDriver` behind `TextExtractor`; image `packages/infrastructure/infra-tools/images/ocr`, run by the tools stack on ECS Fargate (ADR 0444)            |
| `ui://` resources                                               | Yes. ADR 0348 d2; `uiResourceTable`, `uiResourcesFor` in `@stackra/mcp`                                                                                                         |
| Never-bypass floor                                              | Yes. ADR 0360 d8                                                                                                                                                                |
| Speech-to-text                                                  | **Already exists** behind a port: `SpeechService` (listen, speak, region-mapped Connection, metered), ADR 0376, `@stackra/integrations`                                         |
| Saved views                                                     | Model and store driver exist (`panel.stored_view`, `StoredViewService`, `panel.view.share` permission); **no actions**                                                          |
| Sidekick components                                             | `AssistantPanel`, `ApprovalCard`, `PlanView` were built in ui-pro (STA-348 FR-040), now `@stackra-pro`                                                                          |
| OS `ai` service                                                 | Skeleton only on os `figentra/sta-705-ai` (4f57f0df): module, config, no modules                                                                                                |
| Hybrid reranker, Arabic stemming, Arabizi, synonyms             | Absent                                                                                                                                                                          |
| React/native AI entry, client tools, page context, tours, cards | Absent                                                                                                                                                                          |

## Impact

- **Apps touched**: none in core (the console, mobile and till placements are OS lines' work, D05)
- **Services touched**: none in core; OS `ai` (STA-705) hosts the runtime and gateway; OS services that mount panel,
  settings and experience carry their migrations; Commerce owns the shopper agent, its cards, `checkout.prepare`
  and the order timeline
- **Packages touched**: `@stackra/ai` (+ `./react`, `./native`), `@stackra/gen`, `@stackra/mcp`, `@stackra/panel`,
  `@stackra/settings`, `@stackra/experience`, `@stackra/ui`, `@stackra-pro/ui-pro` (three components leave),
  `@stackra/search`, `@stackra/reports` (`Forecaster` port), `@stackra/infra-tools` (images, catalogue, GPU capacity),
  `@stackra/integrations` (speech providers), `@stackra/runway` (edge routes), a new Expo module package
  `@stackra/native-audio` (ADR 0478)
- **Cross-service events**: none new in core; Commerce's order, payment and fulfilment integration events feed its
  `order_timeline` projection (ADR 0491 d3); the payments module emits the payer-confirmed event the approval gate reads
- **Tenancy and data**: new tenant-owned tables `panel.dashboard_layouts`, `settings.user_settings` (if not covered
  by `stored_settings` at user scope; lane 3 decides from the code), `experience.tour_progress`, `search.synonyms`;
  all `BelongsToTenant`, forced RLS; the run store gains a client-tool park reason
- **Secrets**: names only; reranker and embedder tokens follow `search.embedder.tokenSecret`; speech provider keys
  through Connection credential references; WhatsApp `META_APP_SECRET` (existing); no value read
- **ADR needed**: yes; 0490, 0491, 0492, accepted by the owner on 2026-10-30
- **New dependencies**: `@ai-sdk/react` (`catalog:ai`) and `expo-audio` (`catalog:mobile`), approved by the owner on
  2026-10-30; `@aws-sdk/client-transcribe-streaming` pending; images (not npm): text-embeddings-inference,
  StatsForecast, implicit, faster-whisper
- **Deploy modes**: SaaS (Figentra's regional ai service and tools stack), white-label managed and self-hosted use
  the same ports and drivers; the tools-stack images run wherever the root runway's tools stack runs
- **Licence tier**: free (all AI code is free, ADR 0155 decision 3); Commerce's shopper agent is product code
- **Docs to update**: ADRs 0490 to 0492 (done), `.agents/rules/ai-tools.md` (done), each touched package's README and
  AGENTS.md, the infra-tools "Pinned images" section, the search guide page for reranking and Arabic
- **Lane**: full
- **Change risk**: R3 (new AI surfaces over tenant data, payment approvals, outbound HTTP to model, search and speech
  providers, GPU infrastructure)

## Requirements

### Lane 1 — SDK and sidekick (STA-1630)

| Id     | Requirement                                                                                                        | Source         |
| ------ | ------------------------------------------------------------------------------------------------------------------ | -------------- |
| FR-101 | `@stackra/ai/react`: `AiProvider`, `useAgent` (send, stream, stop, retry, resume after approval), `usePageContext` | 0490 d12       |
| FR-102 | `@stackra/ai/native`: the same hooks on React Native (expo fetch streaming)                                        | 0490 d12       |
| FR-103 | Stream client speaks the AI SDK UI message stream, including `client_tool`, `approval` and `card` parts            | 0490 d4, d14   |
| FR-104 | Sidekick contract in `@stackra/ui`; web (HeroUI) and native (HeroUI Native) implementations; RTL; seven locales    | 0490 d13       |
| FR-105 | Move `AssistantPanel`, `ApprovalCard`, `PlanView` from ui-pro to ui, with tests                                    | 0490 d13       |
| FR-106 | `useVoiceInput`: web MediaRecorder; native through `@stackra/native-audio`; streams to the ai service speech route | 0490 d15, 0376 |
| FR-107 | Placement in the console shell, the mobile staff app and the till (OS lines consume it)                            | brief          |

### Lane 2 — client tools and page context (STA-1631)

| Id     | Requirement                                                                                                           | Source   |
| ------ | --------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-201 | `ToolSource.Client`; ADR 0245 d3 amended text in the enum docblock                                                    | 0490 d1  |
| FR-202 | gen writes `#stackra/client-tools` per app from routes, panel resources, action placements, theming, tours, anchors   | 0490 d1  |
| FR-203 | gen checks: name collision, `.prefill` of a `tool: false` action, undeclared anchor, non-public-id record param       | 0490 enf |
| FR-204 | Session descriptor and per-surface filtering; no client tools for MCP, WhatsApp or background runs                    | 0490 d3  |
| FR-205 | `AgentRuntime` parks on a client tool call; `ai.run.client_result` action; 30 s timeout → `client_unavailable`        | 0490 d4  |
| FR-206 | Generated handlers for each client tool kind (router, panel list state, action modal prefill, theming preview, point) | 0490 d1  |
| FR-207 | `PageContext` schema; route `context` declaration; panel pages publish automatically; ≤ 200 selection ids             | 0490 d5  |
| FR-208 | Server-side resolution: drop unreadable ids, `Facts` per record, data-class allow-list, token budget                  | 0490 d6  |

### Lane 3 — personalisation as actions (STA-1632)

| Id     | Requirement                                                                                                           | Source  |
| ------ | --------------------------------------------------------------------------------------------------------------------- | ------- |
| FR-301 | `panel.view.create`, `.update`, `.delete`, `.set_default`, `.share`, `.unshare`; `panel.view.list` (tools by default) | 0490 d7 |
| FR-302 | `panel.dashboard.arrange`, `panel.widget.add`, `.remove`, `.resize`, `.reset` over the personal overlay (0307 d20)    | 0490 d7 |
| FR-303 | `settings.user_setting.set`, `.reset`, `settings.user_setting.list` for theme, mode, density, locale, home, shortcuts | 0490 d7 |
| FR-304 | Risks per the ADR table; shared and tenant-wide changes keep the floor and promotion                                  | 0490 d8 |

### Lane 4 — tours (STA-1633)

| Id     | Requirement                                                                                         | Source   |
| ------ | --------------------------------------------------------------------------------------------------- | -------- |
| FR-401 | `Tour` document kind in `@stackra/experience`: steps (client tool call, text, anchor, advance rule) | 0490 d10 |
| FR-402 | Validator against the app's client tool table, at gen and on save                                   | 0490 d10 |
| FR-403 | `experience.tour.save` (L1), `experience.tour_progress.*` (L0), resume and skip-done                | 0490 d11 |
| FR-404 | Tour runner in the sidekick (web and native): highlight anchor, advance, stop                       | 0490 d11 |
| FR-405 | Onboarding: a role-bound tour on first sign-in (setting); tenant overlay to hide or reorder steps   | 0490 d11 |

### Lane 5 — shopper cards and chat storefront (STA-1634)

| Id     | Requirement                                                                                                             | Source      |
| ------ | ----------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-501 | `Card` kind keyed by an output `Schema`: web component, native component, message projection                            | 0490 d14    |
| FR-502 | gen builds each card's web component into a `ui://<module>/<name>` single-file bundle, published to the static Worker   | 0348 d2     |
| FR-503 | Message projection renderer for WhatsApp interactive messages and SMS fallback, in the OS integrations driver           | 0491 d2, d8 |
| FR-504 | Storefront chat: the sidekick in shopper mode (guest and customer sessions), no staff tools reachable                   | 0491 d1     |
| FR-505 | Commerce (dependency): `ShopperAgent`, the six cards, `order_timeline`, `orders.order.track`, B2B and marketplace flows | 0491 d1-d5  |

### Lane 6 — checkout step-up (STA-1635)

| Id     | Requirement                                                                                                                         | Source   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-601 | `payer` approval kind in the approval gate: resolved only by the provider's confirmed event for the bound intent, or a verified OTP | 0491 d6  |
| FR-602 | A staff `financial` action never resolves through `payer`; tests per floor item stay green                                          | 0491 d7  |
| FR-603 | Redaction guardrail rules for card numbers and one-time codes in prompts, tool outputs and stored messages                          | 0491 enf |
| FR-604 | `CheckoutCard` button → short-lived hosted payment page bound to the intent (storefront route)                                      | 0491 d6  |
| FR-605 | Commerce (dependency): `commerce.checkout.prepare`, intent binding, cart-change voids, wallet sheet and 3DS on the storefront       | 0491 d6  |

### Lane 7 — hybrid search quality (STA-1636)

| Id     | Requirement                                                                                           | Source   |
| ------ | ----------------------------------------------------------------------------------------------------- | -------- |
| FR-701 | `Reranker` port; `HttpRerankerDriver` (TEI `/rerank`), memory driver; `rerank` on request and model   | 0492 d4  |
| FR-702 | Arabic Snowball stemmer lane for Arabic locales, via the versioned index swap                         | 0492 d5  |
| FR-703 | Arabizi query mapping; `search.synonym` model with actions; query expansion                           | 0492 d5  |
| FR-704 | Evaluation fixture catalogue and query set (Arabic, English, mixed); NDCG@10 and recall@50 `test:int` | 0492 enf |

### Lane 8 — ML workers and speech (STA-1637)

| Id     | Requirement                                                                                                           | Source   |
| ------ | --------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-801 | `tools-retrieval` catalogue entry (TEI, `bge-m3` + `bge-reranker-v2-m3` pinned by revision); GPU capacity provider    | 0492 d8  |
| FR-802 | `images/forecast` (StatsForecast) with a batch HTTP contract; `Forecaster` port and HTTP driver in `@stackra/reports` | 0492 d8  |
| FR-803 | `Recommender` port in `@stackra/search`: Postgres driver (co-occurrence read model + vector nearest) day one          | 0492 d8  |
| FR-804 | `images/recommend` (implicit ALS) and its HTTP driver, enabled per tenant by a settings threshold                     | 0492 d8  |
| FR-805 | `images/speech` (faster-whisper) as an in-region speech provider for the 0376 region map                              | 0492 d9  |
| FR-806 | `validate-repository.mjs`: a `.py` file outside `packages/infrastructure/infra-tools/images/` fails                   | 0492 enf |

### Lane 9 — runtime deployment (STA-1638)

| Id     | Requirement                                                                                                      | Source  |
| ------ | ---------------------------------------------------------------------------------------------------------------- | ------- |
| FR-901 | Gateway contracts in `@stackra/mcp`: union tool table over the region's manifests, per-tenant entitlement filter | 0492 d3 |
| FR-902 | Manifest and client-endpoint registration for a product outside OS's Encore app                                  | 0492 d3 |
| FR-903 | Runway edge routes: `mcp.<label>.figentra.com` and `/app/ai/*` to the region's ai service, rate limits           | 0492 d2 |
| FR-904 | OS (dependency, STA-705): the ai service mounts runtime, stores, relay, speech route and MCP server; deploys GCC | 0492 d1 |

## Dependencies on OS and Commerce

| Who                                               | What                                                                                                       | Blocks                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------ |
| OS · Services A (STA-705)                         | ai service: runtime, run/conversation stores, MCP server, client-result route, speech route, deploy        | lanes 1, 2, 5, 9 live    |
| OS (service mounting panel, settings, experience) | migrations for the lane 3 and 4 tables                                                                     | lanes 3, 4 live          |
| OS integrations                                   | WhatsApp Business Platform driver (messages, interactive messages), the message projection renderer        | lane 5 on WhatsApp       |
| OS lines (console@3, mobile@3, till)              | place the sidekick, declare anchors, publish page context                                                  | lanes 1, 2, 4 in product |
| Commerce · Services                               | `ShopperAgent`, cards, `checkout.prepare`, `order_timeline`, `@Searchable` filters, B2B and marketplace    | lanes 5, 6 in product    |
| Commerce · Frontend                               | storefront chat placement, hosted payment page, wallet and 3DS                                             | lanes 5, 6 in product    |
| Owner                                             | ADR approval; catalog entries; GPU cost per region; Meta business verification; MCP host directory reviews | all                      |

## Owner questions

Answered 2026-10-30: 1 to 5 approved as proposed (recommender threshold 10,000 orders or 100,000 events). Still open: 6, the
GCC speech provider; lane 8 builds `tools-speech` either way and the region map names the provider when chosen.

1. Approve ADRs 0490, 0491, 0492 as written, or with changes.
2. Catalog: `@ai-sdk/react` and `expo-audio`.
3. GPU: one GPU instance per region for `tools-retrieval` (and `tools-speech` where named) — approve the cost, or start
   reranking on CPU (slower: roughly hundreds of ms for 50 candidates) or a provider's in-region endpoint.
4. Moving `AssistantPanel`, `ApprovalCard`, `PlanView` from `@stackra-pro/ui-pro` to free `@stackra/ui` (0155 d3).
5. Recommendation threshold for switching a tenant to `tools-recommend` (proposed: 10,000 orders or 100,000 events).
6. Speech provider for GCC in the region map (a provider's endpoint, or `tools-speech` in-region).

## Success criteria

- SC-001: a console user asks "show me unpaid orders from last week and save that view"; the agent filters the list
  (client tool) and saves the view (server action, L0) with no hand-written tool.
- SC-002: a shopper on WhatsApp and in ChatGPT sees the same `ProductCard` and `CartCard` data, and pays only through
  a payer step-up the agent never touches.
- SC-003: the Arabic and English evaluation set's NDCG@10 rises with the reranker on, and no later change lowers it.
- SC-004: no `.py` file outside the tools-stack images; no Python service exists.
- SC-005: every new public symbol has a docblocked file, a test beside it and a barrel entry; the tester's gate is
  green per lane commit.

## Status history

- 2026-10-30 Draft, waiting for the owner on ADRs 0490 to 0492 and six questions.
- 2026-10-30 → Clarified: owner accepted the ADRs and the spec, answered questions 1 to 5, chose all three speech
  providers (question 6); Impact questionnaire completed from those answers.
