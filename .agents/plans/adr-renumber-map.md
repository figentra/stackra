# ADR renumbering map

Status: 2026-10-19. Old ADR numbers (Figentra, Basalt, Platform, Academorix, Juristra) are not Stackra numbers.
This table says what each old reference becomes. New ADRs live in `apps/docs/src/adr/`; cite them by path.
After this map is applied, no file in the repo or in `~/.claude/rules` should contain an old number.

## 1. References found in the Stackra repo (grep, excluding `.old`, `node_modules`, `apps/docs/src/adr`)

| File | Line | Old reference | Replace with |
| --- | --- | --- | --- |
| `lefthook.yml` | 14 | ADR-0034 (Figentra roster; cited for "--check not --write") | `adr/0017-agent-roster-and-models` is the wrong target: this comment is about concurrent edits. Cite `agents/concurrent-sessions` once it exists; until then drop the citation. |
| `packages/tooling/vitest/README.md` | 19 | ADR-0007 (Figentra DI) | `adr/0005-di-container-and-legacy-decorators` |
| `packages/tooling/vitest/preset-decorators.ts` | 4 | ADR-0007 | `adr/0005-di-container-and-legacy-decorators` |
| `packages/tooling/vitest/src/__tests__/presets.test.ts` | 3 | ADR-0007 | `adr/0005-di-container-and-legacy-decorators` |
| `packages/tooling/typescript/base.json` | 41 | ADR-0007 | `adr/0005-di-container-and-legacy-decorators` |
| `packages/tooling/typescript/decorators.json` | 2 | ADR-0007 | `adr/0005-di-container-and-legacy-decorators` |
| `packages/tooling/oxlint/decorators.jsonc` | 2 | ADR-0007 | `adr/0005-di-container-and-legacy-decorators` |
| `packages/tooling/oxlint/boundaries.jsonc` | 9 | ADR-0026 §1, Basalt ADR-0004/0029 | `adr/0004-package-archetypes-and-layers` |
| `packages/tooling/oxlint/boundaries.jsonc` | 31, 60, 79 | ADR-0026 §1 | `adr/0004-package-archetypes-and-layers` |
| `packages/tooling/oxlint/boundaries.jsonc` | 98 | Basalt ADR-0029 (native composes react, never web) | `adr/0004-package-archetypes-and-layers` (rule 3) |
| `packages/tooling/oxlint/boundaries.jsonc` | 128 | ADR-0007 | `adr/0005-di-container-and-legacy-decorators` |
| `packages/tooling/tsdown/index.ts` | 14 | ADR-0007 | `adr/0005-di-container-and-legacy-decorators` |
| `lefthook.yml` | 4 | not an ADR number, but says ".gitlab-ci.yml is the gate" | change when `adr/0012-code-host-and-ci` is accepted |
| `.agents/plans/docs-port-inventory.md` | many | historical mentions in the plan | leave; the plan is a record |

Pattern to rewrite in one commit after the `packages/tooling` editing finishes: replace the text `ADR-0007` by `docs: adr/0005`, `ADR-0026 §1` and `Basalt ADR-00(04|29)` by `docs: adr/0004`.

## 2. Figentra ADRs

| Old reference | Topic | New home |
| --- | --- | --- |
| Figentra ADR-0001 (technology stack) | stack and "not introduced" list | `adr/0011-rejected-and-deferred-technologies`, `adr/0001-monorepo-layout` |
| ADR-0006 (data access wave 0) | MikroORM, migrations | `adr/0014-data-ownership-and-orm` |
| ADR-0007 (DI container) | legacy decorators, explicit tokens | `adr/0005-di-container-and-legacy-decorators` |
| ADR-0009 (support package) | pure helpers | `adr/0005-di-container-and-legacy-decorators` rule 4 |
| ADR-0010 (module specifiers) | extensionless imports | `adr/0006-naming-exports-and-imports` |
| ADR-0012 (i18n) | i18n | none yet; `standards/i18n-rtl` |
| ADR-0017, 0018, 0020, 0021, 0029 | instance modules, events, config, application layer, node entry | `adr/0018-framework-design-record` (reading list) |
| ADR-0019 (subpath imports) | `#entry` imports | `adr/0006-naming-exports-and-imports` rule 5 |
| ADR-0022 (CLI) | figentra CLI | none, drop the citation |
| ADR-0023 (delegation to opencode) | retired delegation | `adr/0017-agent-roster-and-models`, `adr/0011-rejected-and-deferred-technologies` |
| ADR-0024 (required files) | README, AGENTS, PII | `standards/members` (no ADR) |
| ADR-0025 (vite preset tier) | none | none, drop the citation |
| ADR-0026 (archetypes and host entries) | archetypes, layers | `adr/0004-package-archetypes-and-layers` |
| ADR-0033, 0041 (categories) | Figentra package categories | none: Stackra has its own ten categories in `guides/packages` |
| ADR-0034 (roster and models) | tiers, models | `adr/0017-agent-roster-and-models` |
| ADR-0035 (conventions freeze) | naming, helpers | `adr/0006-naming-exports-and-imports` |
| ADR-0036 to 0039 (rejected) | rows | `adr/0011-rejected-and-deferred-technologies` |
| other (0002 to 0005, 0008, 0011 to 0016, 0027, 0028, 0030 to 0032, 0040) | product or package designs | `adr/0018-framework-design-record` for framework ones, otherwise none |

## 3. Basalt ADRs (including numbers cited in `~/.claude/rules/*.md`)

| Old reference | Topic | New home |
| --- | --- | --- |
| Basalt ADR-0002, 0023, 0040, 0054 | specs, projections, folder structure, spec engine | `adr/0016-agents-source-of-truth` |
| ADR-0003, 0008 | versioning, changelog and licence | `adr/0013-versioning-and-release` |
| ADR-0004 | package internal structure | `adr/0004-package-archetypes-and-layers` |
| ADR-0005 | services nest by product | none, drop (Stackra has `services/<name>`); `adr/0010-services-are-independent-workspace-members` |
| ADR-0006 | ORM direction | `adr/0014-data-ownership-and-orm` |
| ADR-0010, 0020, 0022, 0032 | naming, exports, import specifiers | `adr/0006-naming-exports-and-imports` |
| ADR-0011 | documentation standard | `adr/0007-source-documentation-standard` |
| ADR-0012 to 0018 | layers, ports, config, resources | `adr/0004-package-archetypes-and-layers`; config and resources in `adr/0018-framework-design-record` |
| ADR-0019 | testing strategy | `adr/0008-test-placement` and `standards/testing` |
| ADR-0021 | tier dependency direction | `adr/0003-tier-dependency-direction` |
| ADR-0024, 0025 | taxonomy, principles | `constitution/index`; categories in `guides/packages` |
| ADR-0026 | AI is not a fifth layer | `adr/0021-ai-engine-and-agent-write-safety` rule 1 |
| ADR-0027 | commands, queries, events | `constitution/http-and-events` |
| ADR-0029 | presentation delivery surfaces | `adr/0004-package-archetypes-and-layers` |
| ADR-0033 (rules: one Encore app per product) | one Encore app | `adr/0010-services-are-independent-workspace-members` (changed: no single Encore app; Encore deferred in `adr/0011`) |
| ADR-0034 | test file placement | `adr/0008-test-placement` |
| ADR-0035 | contract packages | `adr/0015-contract-packages` |
| ADR-0036 | package shape follows archetype | `adr/0004-package-archetypes-and-layers` |
| ADR-0037 to 0039, 0047, 0048, 0051 to 0053 | define-family, bindings, modules, registry, joins | `adr/0018-framework-design-record` |
| ADR-0041, 0042 | schema, IR, compiler | none, drop |
| ADR-0044 | security boundaries (undecided) | `constitution/security` |
| ADR-0046 | service vs module boundaries | `constitution/boundaries`, `adr/0010-services-are-independent-workspace-members` |
| ADR-0049 | database ownership | `adr/0014-data-ownership-and-orm` |
| ADR-0050 | observability (proposed) | `adr/0020-observability-and-crash-reporting` |
| ADR-0056 | package metadata in package.json | `standards/packages` |
| ADR-0071 (rules: console feature in `packages/<product>/features`) | proposed, not in the archive | none, drop the citation |
| ADR-0077 (rules: MikroORM scoped entity) | tenancy mechanism | `adr/0014-data-ownership-and-orm` rule 7, `constitution/tenancy` |
| ADR-0083 (rules: `os/ai` on Encore, AI SDK) | AI engine | `adr/0021-ai-engine-and-agent-write-safety` |
| ADR-0084 (rules: idempotency store in the cache) | idempotency | `constitution/http-and-events` (rule on Idempotency-Key); no ADR |
| ADR-0085 (rules: secrets, Worker secrets) | secrets | `adr/0009-secrets-two-mechanisms`, `constitution/secrets` |
| ADR-0090 (rules: rejected and deferred technologies) | not-built-yet table | `adr/0011-rejected-and-deferred-technologies` |
| ADR-0091 (rules: service checklist) | service checklist | `standards/services` |
| ADR-0097 (platform package organisation) | Basalt layout | none, drop |
| ADR-0160 (rules: shared cache keyspace) | cache cluster | none, drop the citation |
| ADR-0165 (rules, if cited) | not in the archive | none, drop the citation |
| ADR-0169 (rules: `@stackra/container`, Nest-shaped) | DI vocabulary | `adr/0005-di-container-and-legacy-decorators` |
| other (0001, 0007, 0009, 0030, 0031, 0043, 0045, 0055, 0057, 0059) | Basalt-specific | none, drop (0009 is in `adr/0018-framework-design-record`) |

## 4. Platform ADRs

| Old reference | Topic | New home |
| --- | --- | --- |
| Platform ADR-0001, 0002, 0012 | GitHub host, consumed by ref, local CI | `adr/0012-code-host-and-ci`; `runbooks/ci` |
| ADR-0003, 0010, 0011, 0014, 0015, 0016, 0021 | manifest, Workers hosting, capabilities, compose, Terraform, release record, neutrality | none for now (see section 5b of the port plan); neutrality rule is in `constitution/boundaries` |
| ADR-0004 | backend deployment | `runbooks/deploys` |
| ADR-0005, 0018, 0019 | secrets | `adr/0009-secrets-two-mechanisms` |
| ADR-0006 | observability | `adr/0020-observability-and-crash-reporting` |
| ADR-0007, 0008 | mobile EAS, store provisioning | `runbooks/mobile-release` |
| ADR-0009 | Terraform provider pins | `adr/0019-supply-chain-hardening` (pin rule only) |
| ADR-0013 | delegation to opencode | `adr/0017-agent-roster-and-models` (as the retired alternative) |
| ADR-0017 | hardening | `adr/0019-supply-chain-hardening` |
| ADR-0020 | MCP write tools | `adr/0021-ai-engine-and-agent-write-safety` |

## 5. Academorix and Juristra ADRs

| Old reference | Topic | New home |
| --- | --- | --- |
| Academorix ADR-0001 | delegation | `adr/0017-agent-roster-and-models` (retired alternative) |
| Academorix ADR-0007 | AI engine | `adr/0021-ai-engine-and-agent-write-safety` |
| Academorix ADR-0008 | Sentry mobile | `adr/0020-observability-and-crash-reporting` |
| Academorix ADR-0009 | native social sign-in | `runbooks/mobile-release` (store guideline reasoning only) |
| Academorix ADR-0010 | package and service structure | `adr/0004-package-archetypes-and-layers`, `standards/packages` |
| Academorix ADR-0002 to 0006 | product features | none, drop |
| Juristra ADR-0001 | Encore app | `adr/0010-services-are-independent-workspace-members` |
| Juristra ADR-0002 | copied packages with `ORIGIN.md` | `standards/packages` (provenance) |
| Juristra ADR-0004 | tenancy and isolation | `constitution/tenancy`, `adr/0014-data-ownership-and-orm` |
| Juristra ADR-0009 | AI engine | `adr/0021-ai-engine-and-agent-write-safety` |
| Juristra ADR-0003, 0005 to 0008, 0010 to 0012 | product | none, drop |

## 6. Bare numbers named in the task

Bare `ADR-NNNN` with no repo prefix inside Stackra files means Figentra (section 2) unless the file is under `packages/tooling/oxlint` and the number is 0004 or 0029, which are Basalt (section 3). The ones named by the task:

| Bare reference | Meaning | New home |
| --- | --- | --- |
| ADR-0001 | Figentra stack | `adr/0001-monorepo-layout` and `adr/0011-rejected-and-deferred-technologies` (Stackra's own 0001 is different) |
| ADR-0007 | Figentra DI | `adr/0005-di-container-and-legacy-decorators` |
| ADR-0010 | Figentra module specifiers | `adr/0006-naming-exports-and-imports` |
| ADR-0019 | Figentra subpath imports (or Basalt testing strategy) | `adr/0006-naming-exports-and-imports` (or `adr/0008-test-placement`) |
| ADR-0022 | Figentra CLI (or Basalt import style) | none; `adr/0006-naming-exports-and-imports` for the Basalt one |
| ADR-0023 | Figentra delegation (or Basalt generated artifacts) | `adr/0017-agent-roster-and-models` (or `adr/0016-agents-source-of-truth`) |
| ADR-0024 | Figentra required files (or Basalt taxonomy) | `standards/members` (or `guides/packages`) |
| ADR-0026 | Figentra archetypes | `adr/0004-package-archetypes-and-layers` |
| ADR-0033 | Basalt one Encore app | `adr/0010-services-are-independent-workspace-members` |
| ADR-0034 | Figentra roster (or Basalt test placement) | `adr/0017-agent-roster-and-models` (or `adr/0008-test-placement`) |
| Basalt ADR-0004 | package internal structure | `adr/0004-package-archetypes-and-layers` |
| Basalt ADR-0029 | presentation delivery surfaces | `adr/0004-package-archetypes-and-layers` |
