# @stackra/ai

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/search@0.2.0
  - @stackra/outbox@0.2.0
  - @stackra/tenancy@0.2.0
  - @stackra/model@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 534d7c8: Add the approval-mode resolver of ADR 0360 (`resolveApproval` with `ApprovalMode`, in the fixed order IAM,
  entitlement, environment, floor, organisation, user, level; the floor is data), the model router by task, region and
  data class with tenant overrides and disclosed fallbacks (`routeModel`, `resolveModel`, `ModelProviderDriver`), the
  field allow-list per data class and redaction rules (`allowFields`, `redact`), the token budget check (`checkBudget`),
  layered guardrails (`runGuardrails`, `Guardrail`), eval runs (`runEvals`) and the intent router (`routeIntent`).
- d1b23c1: Guardrail drivers and the AI token meter. `PatternGuardrailDriver` (configured patterns), `PiiGuardrailDriver`
  (contact rules plus the Market's national ID formats from `@stackra/validation`), `InjectionGuardrailDriver` (weighted
  signals and hidden characters) and `ClassifierGuardrailDriver` (a routed model picking a label) each block, redact or
  flag per stage (`GuardrailEffect`, `GuardrailStages`). `GuardrailVerdict` may now carry the redacted `text` and
  `flags`, and `runGuardrails` hands redacted text to the next layer and answers `{ pass: true, text, flags }`.
  `AiMeter` writes `usage.recorded` on `ai.tokens` (input and output, model as subject, scope) for entitlement limits.
- 20f3fe9: One vector store (ADR 0465): the `Embedding` model is removed from `./node` and migration `ai.0002_drop_embeddings`
  drops `ai.embeddings`. Embeddings live in `search.vector_items` behind `VectorIndex` of `@stackra/search`, which
  `retrieve()` already reads; conversation memory stores through it with its ids, embedder and content hash as metadata.
  Nothing wrote the old table, so no data moves.
- 2787c1e: Add `@stackra/ai`: the `Prompt`, `Skill` and `Facts<M>` kind bases of a module's `ai/` group, the `ToolSource` and
  `Approval` vocabulary of the generated MCP tool table with `approvalFor`, and `decide()`, a typed choice, score or
  yes/no answer from a model on AI SDK core.
- 0e90fc3: Add the `PageReader` port (`./contracts`, ADR 0450): `read(url)` returns a `PageReading` (final URL, status, title,
  language, readable text and schema.org `ProductHint`s) or a `PageReadRefusal` code. Add `MemoryPageReaderDriver` and
  `HttpPageReaderDriver`, which checks every URL and redirect with `checkEgress` and takes its limits as a
  `PageReaderPolicy` from settings, plus the shared `parsePage` (STA-904, STA-929).
- b966fad: Add the AI action permission matrix to `resolveApproval` (`ActionPermission`, record scope, the market pack's floor,
  the `propose` outcome and the approver rule), the agent runtime (`Agent`, `Promptable`, `AgentRuntime`: prompt, stream,
  queue, resume) over the new `./contracts` ports with memory stores, and the `./node` entry with the ADR 0100 tables,
  the Postgres conversation and run stores and the tenant-key encryption cast `ScopeKeyCast`.
- 975a6c1: Add `retrieve(query, { index, embedder, topK, scope })`, the retrieval helper for `Facts`: it embeds the query with the
  `Embedder`, asks the `VectorIndex` (both from `@stackra/search/contracts`) for the top-k hits in the caller's scope and
  returns `RetrievedPassage`s (text, source id, score) for `provide` to return. Adds the `@stackra/search` dependency.
- 900e79d: Add the three integration events of ADR 0100 decision 11, `ApprovalRequested`, `ApprovalResolved` and `RunCompleted`,
  recorded by `PostgresRunStoreDriver` on the row that changes so the outbox writes them with it (STA-781).
- 6006b78: Bind encrypted fields to the scope that owns the row (gap gov8, ADR 0476). `HasEncryptedFields({ scope: "tenantId" },
  ...fields)` seals and opens each value in `<model key>.<field>@<scope id>`, so a value copied into another scope's row
  does not open; the subscriber and `EncryptedFieldsResealService` read the id from the row and refuse a row without
  one, and `encryptedScopeOf` reads the option. `@stackra/ai`'s `Message` now declares its content this way, and
  `ScopeKeyCast` is removed from `@stackra/ai/node`: `PostgresConversationStoreDriver` takes only its two repositories.
- acff14a: Erasure fan-out, cache and AI parts (data-layer gaps gov6 and ca16; STA-1444). `CacheKey.subject(id)` is the subject
  tag (`~subject:<id>`) every entry holding a person's data carries, so an erasure drops them with
  `forgetTag(CacheKey.subject(id))`. `ConversationStore.forget(principalId)` erases a principal's conversations and their
  messages in the memory and Postgres drivers; a message under a legal hold stays with its conversation.
- d19a3d5: `AgentRuntime` meters and guards every run (STA-1385). It now takes `AiMeter` and `DiscoveryService` (two new
  constructor parameters, bound by gen): each settled loop's token usage goes to `AiMeter.tokens` (run id, routed model,
  scope, actor), and every bound `GuardrailLayer` checks the prompt before it is stored and the final answer before it is
  stored. A redaction is what the conversation keeps; a block throws the new `GuardrailBlockedError` (403,
  `guardrail_blocked`), failing the run when it is the answer.

### Patch Changes

- 13ad6ab: The guardrail options (`PatternGuardrailOptions`, `PiiGuardrailOptions`, `InjectionGuardrailOptions`,
  `ClassifierGuardrailOptions`) are now abstract classes exported at runtime, so each guardrail driver's constructor
  takes a class token that `stackra gen` and the container accept. Object literals still fit; a host that lets the
  container build a layer binds the options token with `useValue`.
- b8fc2ac: `Message.content` carries `@Classified(DataClassification.Personal)`, so export, erasure and the logs treat the sealed
  prompt and response text as personal data and gen's `encrypted_field_unclassified` check passes (ADR 0465, ADR 0476).
- 5ae13cb: Each `AppendOnly` model's table now has a migration that calls `t.appendOnly()` (STA-1413), so `UPDATE` is revoked
  from `public` and the service's role and gen's `append_only_not_revoked` check passes: access-log 0003 (access and
  audit log entries), ai 0003 (`messages`, `steps`, `tool_calls`) and loyalty-kit 0003 (`ledger_entries`, exported as
  `AppendOnlyLedgerEntriesMigration`).
- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- a681685: `AssuranceLevel` and `MeterKind` have one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/actions/contracts`
  and `@stackra/identity` no longer export `AssuranceLevel`, and `@stackra/actions` and `@stackra/model` no longer export
  `MeterKind`; import both from `@stackra/contracts`. The codes are unchanged.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [0abe92d]
- Updated dependencies [bc4acfc]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [94ae85f]
- Updated dependencies [dddbbcd]
- Updated dependencies [856995c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [ca85d59]
- Updated dependencies [d72a734]
- Updated dependencies [9841d79]
- Updated dependencies [f6d1a76]
- Updated dependencies [c196bc6]
- Updated dependencies [49ab0e6]
- Updated dependencies [d156aa8]
- Updated dependencies [6d46e5e]
- Updated dependencies [2787c1e]
- Updated dependencies [38a5501]
- Updated dependencies [e0f2fc8]
- Updated dependencies [62c7ae1]
- Updated dependencies [c868bad]
- Updated dependencies [0d36f0d]
- Updated dependencies [a701ccb]
- Updated dependencies [a526605]
- Updated dependencies [da8bdbd]
- Updated dependencies [763e901]
- Updated dependencies [936fcb1]
- Updated dependencies [f11cbe8]
- Updated dependencies [f7a2d36]
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [483eb44]
- Updated dependencies [fb93026]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [d5e5ff8]
- Updated dependencies [9841d79]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c580aa4]
- Updated dependencies [7e60fa9]
- Updated dependencies [b62c042]
- Updated dependencies [e52a367]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [09080ac]
- Updated dependencies [0a20a9f]
- Updated dependencies [2787c1e]
- Updated dependencies [3d34a5d]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [a31d463]
- Updated dependencies [38bebd1]
- Updated dependencies [cf64395]
- Updated dependencies [158f6cf]
- Updated dependencies [1f34fad]
- Updated dependencies [d72a734]
- Updated dependencies [68ae29e]
- Updated dependencies [20f3fe9]
- Updated dependencies [2787c1e]
- Updated dependencies [3649655]
- Updated dependencies [9811f8d]
- Updated dependencies [be97996]
- Updated dependencies [41035cc]
- Updated dependencies [7055e31]
- Updated dependencies [1e3e28d]
- Updated dependencies [7e60fa9]
- Updated dependencies [d156aa8]
- Updated dependencies [02a7917]
- Updated dependencies [fdf4b94]
- Updated dependencies [3671963]
- Updated dependencies [640ae17]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [a45c902]
- Updated dependencies [2c0ea71]
- Updated dependencies [ab9cc36]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/events@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/search@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/tenancy@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
