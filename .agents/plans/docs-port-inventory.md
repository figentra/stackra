# Docs port plan: governance docs into Stackra

Status: proposed, 2026-10-19. Nothing is ported yet. This file is the plan for review; each row becomes one docs task.

Source legend (newest or best copy is listed first in every row):

| prefix | repo | path base |
| --- | --- | --- |
| `B:` | `/Users/akouta/Projects/.old/old/basalt` | `adr/`, `eng/`, `std/`, `plans/` = `apps/docs/src/{adr,engineering,standards,plans}/`; other paths from repo root |
| `F:` | `/Users/akouta/Projects/figentra` | `const/` = `docs/constitution/`, `adr/` = `docs/adr/` |
| `A:` | `/Users/akouta/Projects/academorix` | repo root (`adr/` = `docs/adr/`) |
| `P:` | `/Users/akouta/Projects/platform` | repo root (`adr/` = `docs/adr/`, `rb/` = `docs/runbooks/`) |
| `J:` / `M:` | `/Users/akouta/Projects/juristra` / `muslin` | repo root |
| `G:` | `/Users/akouta/.claude/rules` | file name |

Inventories this plan merges: `scratchpad/doc-inventory/{basalt,figentra,academorix,platform,juristra-muslin-global}.md`.

---

## 1. Summary

| source | inventory rows (non-business) | business/domain files excluded (counted, not listed) |
| --- | --- | --- |
| Basalt (archived) | 177 | ~165 |
| Figentra | 111 | ~2,100 (briefs, V4 demo, specs, sales) |
| Academorix | 173 | ~4,175 (UAE PASS pack, briefs, logs, product specs) |
| Platform (enterprise-ci-cd) | 146 | 0 (consumer data rows only, in section 5) |
| Juristra + Muslin + `~/.claude/rules` | 89 | ~260 |
| **Total** | **696** | |

After de-duplication the 696 rows collapse to **65 unique topics**: **60 rows** in section 3 and **5 deferred topics** in section 5b.

- Rows in section 3: **12 adopt**, **48 adapt**. Everything else is **skip**: about 230 inventory rows, grouped into 24 lines in section 5a.
- Priority of the rows: **31 P0**, **22 P1**, **7 P2**. Section 5b holds the deferred items, and they have no priority until their trigger.
- The resulting docs set: 7 constitution pages, 19 new ADRs (0003–0021), 9 standards pages, 7 runbooks plus 1 deferred operations page, 5 guides (3 of them exist today), 7 agents pages, and 4 repository-root targets.

Three findings shape the plan:

1. **Stackra already cites ADRs it doesn't have.** Its own files cite ADR-0007 (Figentra's DI and legacy-decorators decision), ADR-0026 (Figentra's package archetypes), ADR-0034 (Figentra's roster), Basalt ADR-0004 and Basalt ADR-0029. They appear in `packages/tooling/{oxlint,typescript,vitest,tsdown}` and `lefthook.yml`. Stackra has only 0001 and 0002, so the renumbering below has to come with one sweep that fixes these citations (section 6, conflict 2).
2. **No CI file exists.** `lefthook.yml` says `.gitlab-ci.yml` is the gate, but there is no `.gitlab-ci.yml` and no `.github/` in the repo. Choosing the code host is a P0 human decision (conflict 4).
3. **The best rule sources are the newest ones, not Basalt.** Basalt is the oldest snapshot. For secrets, the most complete source is the Platform constitution. For layout and boundaries it is the `G:` rules. For the agent tree it is Basalt and Academorix, which are equivalent.

---

## 2. Proposed `apps/docs` information architecture (governance only)

The tabs and groups below go into `apps/docs/src/docs.json`. A path ending in `(exists)` is already in the repo, and a path ending in `(moves)` is an existing page that gets a new path. Moves happen only after the agent now editing `guides/standards.mdx` has finished.

```
src/
├── index, quickstart, development                    (exists)  Get started; development.mdx absorbs local setup
├── guides/                                           tab "Guides"
│   ├── structure, packages, tooling                  (exists)  tooling.mdx absorbs the task vocabulary
│   ├── workflow                                      (exists)  git, commits, PRs, changesets, hooks
│   ├── definition-of-done                            new
│   └── scaffolding                                   new       pnpm new, templates, codemods
├── constitution/                                     tab "Constitution" (laws; an ADR may refine a law, never contradict it)
│   ├── index        laws hierarchy + architecture principles
│   ├── boundaries   tiers, dependency direction, placement test, no literals in shared packages
│   ├── secrets      two mechanisms, articles each bound to a check
│   ├── security     principal, server-side authz, audit, data classes, supply chain
│   ├── http-and-events
│   ├── tenancy      two-layer isolation (in force from the first tenant-owned table)
│   └── delegation   who decides, who executes, brief contract
├── standards/                                        tab "Standards" (operating rules, each names its check)
│   ├── members      (moves from guides/standards.mdx)  required files, PII table, package.json fields
│   ├── packages     archetypes, four layers, exports, provenance of copied code
│   ├── services     Encore service checklist
│   ├── apps         vite / expo / docs / next app rules, budgets, no fixtures in dist
│   ├── code-style   file contract, docblocks, naming, one declaration per file, imports
│   ├── testing      (moves from guides/testing.mdx)
│   ├── dependencies (moves from guides/catalogs.mdx)  catalogs, mise pins, licences, release age
│   ├── i18n-rtl
│   └── ui-and-accessibility   reuse-first UI checklist, WCAG 2.2 AA, contrast, design-brand rules
├── runbooks/                                         tab "Runbooks"
│   ├── secrets      vault layout, mcp.sh, doctor, rotation
│   ├── ci           the gate, local parity, ci-fallback (break-glass deploy)
│   ├── release      changesets, publish, release notes
│   ├── mobile-release   EAS build / submit / OTA, store bootstrap
│   ├── renovate
│   ├── deploys      Encore staging→prod, owner runs deploys, rollback
│   └── upgrade      toolchain, Expo SDK, Encore, preset upgrades
├── agents/                                           tab "Agents"
│   ├── index        .agents is the source; assistant dirs are projections; rule frontmatter
│   ├── roster       tiers, who blocks, routing, models
│   ├── hooks
│   ├── skills
│   ├── spec-lifecycle   requirements→design→tasks, review checklist, durable findings
│   ├── concurrent-sessions  shared clone, worktrees, preconditions, phased work
│   └── rules-that-dont-rot
├── adr/                                              tab "Architecture" (exists): index + 0001–0002 exist; 0003–0021 new
└── writing/                                          (exists, unchanged)
```

Lean decisions:

- The constitution holds laws, standards hold operating rules, and guides hold how-to pages. Each topic gets one page, and no topic is split across two tabs.
- No `engineering/` tab. Basalt's engineering pages go to `guides/` (definition of done) or `agents/`.
- Operations runbooks (incident, SLOs, DR, access review, break-glass) are deferred to P2 and will get one page (`runbooks/operations`) only when Stackra deploys something to production.
- Terraform gets no page until Stackra owns infrastructure (section 5b).

---

## 3. Master table (grouped by target page)

Action key: **adopt** means port nearly as is. **adapt: X** means port with change X.
Priority key: **P0** is needed before the first real package or service, **P1** soon, **P2** later.

### Constitution

| # | proposed Stackra page | sources merged (newest/best first) | what it says | action | priority |
| --- | --- | --- | --- | --- | --- |
| 1 | `constitution/index.mdx` | F:const/README.md; B:adr/0025-architecture-principles.md; B:eng/overview.mdx | Laws outrank ADRs; standing principles reviewers cite; a claim without enforcement is a comment | adapt: merge principles into the index, de-brand | P0 |
| 2 | `constitution/boundaries.mdx` | G:module-boundary.md; F:const/boundaries.md; B:architecture/tiers-and-boundaries.mdx; B:adr/0046, 0005, 0031; B:{packages/os,apps,services}/README.md; A:.agents/rules/module-boundary.md; A:docs/standards/repository.md; P:adr/0021 (neutrality); M:docs/progress/market-agnostic.md; M:.opencode/rules/muslin-laws.md (packages-vs-apps half) | Tier direction config→lib→service→app; placement test; packages hold factories not literals; no `process.env` in packages | adapt: Stackra kinds and `services/src/<svc>`; drop `@figentra`/`@academorix` tiers and the Figentra ID | P0 |
| 3 | `constitution/secrets.mdx` | P:docs/constitution/secrets.md (articles S1–S13); G:secrets.md; M:.opencode/rules/secrets.md (may / may-not list); F:const/secrets.md; B:.agents/rules/secrets.md; A:.agents/rules/secrets.md | Two secret kinds, humans set values, agents never read them, each article names its enforcing check | adapt: keep only articles whose check Stackra runs or schedules; vault paths `/agents`, `/ci` | P0 |
| 4 | `constitution/security.mdx` | F:const/security.md; P:SECURITY.md (controls); J:docs/threat-model.md (skeleton); A:.agents/skills/security-iam-model (effective-permission formula only) | authHandler principal, server-side authz, audit, data classification, rate limits, threat-model template | adapt: de-brand; IAM naming generic | P1 |
| 5 | `constitution/http-and-events.mdx` | G:http-conventions.md; F:const/http-and-events.md; A:docs/standards/backend-events.md (rule and table format only); B:adr/0027-commands-queries-events.md | One `api()` per operation, auth by default, verbs by idempotency, cursor lists, prefixed ids, Idempotency-Key, versioned events | adapt: prefixed-id registry is Stackra's; drop the per-topic registry | P0 |
| 6 | `constitution/tenancy.mdx` | G:tenancy.md; F:const/tenancy.md; J:docs/adr/0004-tenancy-and-isolation.md | withTenant/withScope plus RLS ENABLE+FORCE; scope tree; OR-expanded predicate; isolation tests | adapt: state the trigger (first tenant-owned table); MikroORM wording | P1 |
| 7 | `constitution/delegation.mdx` | P:docs/delegation.md (rules 2–8, 10); F:const/delegation.md; M:.opencode/rules/coordination.md; F:.agents/briefs/TEMPLATE.md | Claude decides; executors get self-contained briefs; caps; no git writes by executors; review by gates | adapt: Claude-only (opencode lanes retired), brief template as snippet | P1 |

### Architecture decisions (`adr/`, renumbered from 0003)

| # | proposed Stackra page | sources merged | what it says | action | priority |
| --- | --- | --- | --- | --- | --- |
| 8 | `adr/index.mdx` (exists) + `snippets/adr-template.mdx` | F:docs/adr/template.md (Enforcement + Revival trigger); P:adr/index.md (open-work column); B:adr/README.md + template.md; A:docs/adr/README.md; J:docs/adr/README.md | House format, status vocabulary, same-commit supersession, superseded ADRs stay and point forward | adapt: one template with Enforcement and Revival trigger | P0 |
| 9 | `adr/0003-tier-dependency-direction` | B:adr/0021; F:const/boundaries.md | config/lib/service/app tags; Turborepo boundaries enforce direction | adopt | P0 |
| 10 | `adr/0004-package-archetypes-and-layers` | B:adr/0004, 0036, 0012–0016, 0017, 0018; F:adr/0026-package-archetypes-and-host-entries.md; B:std/package-archetypes.mdx | Archetype set; four layers core/application/infrastructure/presentation apply to layered domain packages | adapt: replaces citations of "ADR-0026" and "Basalt ADR-0004/0029" in oxlint `boundaries.jsonc` | P0 |
| 11 | `adr/0005-di-container-and-legacy-decorators` | F:adr/0007-dependency-injection-container.md; F:adr/0009-support-package.md | Nest-shaped container, legacy decorators, explicit tokens, no reflection; env-free support helpers | adapt: replaces the "ADR-0007" citations in typescript/vitest/tsdown/oxlint presets | P0 |
| 12 | `adr/0006-naming-exports-and-imports` | B:adr/0010, 0020, 0022, 0032; F:adr/0010-module-specifiers.md, 0019-subpath-imports.md; F:adr/0035-conventions-freeze.md | kebab files, one declaration per file, kind suffix, barrels re-export only, extensionless and `#entry` imports | adopt: one ADR for all four; freeze conventions before mass creation | P0 |
| 13 | `adr/0007-source-documentation-standard` | B:adr/0011; F:const/documentation.md | File-contract header plus TSDoc on every export | adopt | P0 |
| 14 | `adr/0008-test-placement` | B:adr/0034; B:adr/0019 (strategy part only) | `src/**/__tests__` beside the code; no root `tests/`; what verify proves | adopt | P0 |
| 15 | `adr/0009-secrets-two-mechanisms` | P:adr/0005, 0018; P:adr/0019 (rejected-for-now alternative) | Encore `secret()` for app secrets, Infisical `/agents` + `/ci` via OIDC, names-only in git | adapt: Secret Sync recorded as alternative | P0 |
| 16 | `adr/0010-one-encore-app` | B:adr/0033; J:docs/adr/0001-encore-app.md; P:adr/0004 (deploy path) | One Encore app, services in `services/src/<svc>`, Encore gateway is the only gateway | adapt: single product, no `services/<product>` nesting | P0 |
| 17 | `adr/0011-rejected-and-deferred-technologies` | G:not-built-yet.md; A:.agents/rules/not-built-yet.md; F:adr/0001 ("not introduced" list); F:adr/0036–0039 (rejected) | Table: rejected tech, use instead, revival trigger | adapt: re-validate each row for Stackra; the validator's FORBIDDEN_DEPENDENCIES cites it | P0 |
| 18 | `adr/0012-code-host-and-ci` | P:adr/0001, 0002, 0012; P:docs/research/gitlab-vs-github.md; A:ci/README.md; B:.gitlab/README.md; F:.gitlab-ci.yml header | One host, one required gate (`pnpm verify`), CI logic lives in pnpm scripts so it ports | adapt: human picks the host (conflict 4) | P0 |
| 19 | `adr/0013-versioning-and-release` | B:adr/0003 (npm half), 0008; P:docs/releases/README.md | Changesets per member, CHANGELOG+LICENSE per member, release notes per major | adapt: drop Go/Python | P1 |
| 20 | `adr/0014-data-ownership-and-orm` | B:adr/0049, 0006; F:adr/0006-data-access-wave-0.md | MikroORM over Encore connection; each service owns DB, schema, migrations; no shared entity | adapt | P1 |
| 21 | `adr/0015-contract-packages` | B:adr/0035; B:std/contract-packages.mdx | Contracts package is a stable boundary, not a shared-types dir; event versioning | adopt | P1 |
| 22 | `adr/0016-agents-source-of-truth` | B:adr/0023, 0002, 0040, 0054; A:.agents/README.md | `.agents/` authored once, projected per assistant, provenance markers, drift check; specs hold exactly 3 docs | adapt: sdlc plugin supplies the spec engine | P1 |
| 23 | `adr/0017-agent-roster-and-models` | F:adr/0034-agent-roster-and-models.md (with its weak-results evidence); A:.agents/models.json; F:adr/0023, A:adr/0001, P:adr/0013 (opencode delegation, superseded, as rejected alternative) | Agents declare a tier not a model; Claude-only; why delegating to GLM was retired | adapt: replaces the "ADR-0034" citation in `lefthook.yml` | P1 |
| 24 | `adr/0018-framework-design-record` | B:adr/0009, 0037, 0038, 0039, 0047, 0048, 0051, 0052, 0053, 0026; F:adr/0017, 0020, 0021, 0022, 0025, 0029, 0012; A:.agents/specs/001–041; B:plans/driver-packages.mdx | define-family, keyed bindings, modules, registry, console/pipeline/connector, config namespaces, node entry, AI inside application | adapt: one ADR per decision **only when the package lands**; until then a link list | P2 |
| 25 | `adr/0019-supply-chain-hardening` | P:adr/0017, 0009; P:tests/pins/*.test.mjs; P:.github/zizmor.yml | SHA-pinned actions, cosign SBOM/provenance, exact provider pins | adapt | P2 |
| 26 | `adr/0020-observability-and-crash-reporting` | A:adr/0008-sentry-mobile-errors.md; P:adr/0006; B:adr/0050 (open question) | Sentry without PII and without URL-bearing tracing; vendor behind config | adapt | P2 |
| 27 | `adr/0021-ai-engine-and-agent-write-safety` | A:adr/0007-ai-engine.md; J:docs/adr/0009-ai-engine.md; P:adr/0020; P:packages/mcp/{README,AGENTS}.md; A:.agents/skills/ai-mcp-tools | AI SDK core + MCP SDK, no gateway; MCP writes only behind named human approval | adapt | P2 |

### Standards

| # | proposed Stackra page | sources merged | what it says | action | priority |
| --- | --- | --- | --- | --- | --- |
| 28 | `standards/members.mdx` (moves from `guides/standards.mdx`) | B:std/required-files.mdx; F:adr/0024-required-files-per-member.md; F:tooling/scripts/AGENTS.md (validator rule list); J/M apps+services AGENTS.md PII sections; B:apps/docs/AGENTS.md | README, AGENTS (with `## PII`), CHANGELOG, LICENSE; package.json fields; each rule names its validator check | adapt: page exists and is being edited now; merge after | P0 |
| 29 | `standards/packages.mdx` | A:docs/standards/package.md (+ check-package-shape.mjs); F:const/packages.md; B:std/package-archetypes.mdx; B:adr/0056 (`sdlc` key in package.json); B:PACKAGE_QUALITY_STANDARDS.md (checklist only); A:docs/adr/0010-package-and-service-structure.md (who-imports reasoning); F:docs/plans/2026-10-03-reference-packages-port-or-rewrite.md (rubric); J:docs/adr/0002 + `ORIGIN.md` pattern; B:packages/tooling/README.md + 4× AGENTS.md (presets ship data, change the preset not the consumer) | Shape per archetype, exports to `./src`, barrels, no deep imports, provenance of copied code, port-or-rewrite rubric | adapt: categories stay in `guides/packages.mdx` | P0 |
| 30 | `standards/services.mdx` | G:service-checklist.md; J:services/AGENTS.md; M:services/AGENTS.md (describeIsolation, calls inside service dirs); M:services/README.md (add-a-service recipe); A:.agents/rules/service-checklist.md | Eight non-negotiables: placement, isolation, event-first, one gateway, idempotency, required files, secrets, DoD | adapt: inline the service checklist (Basalt ADR-0091 doesn't exist) | P0 |
| 31 | `standards/apps.mdx` | B:apps/README.md; A:apps/mobile/README.md (env + feature-flag pattern); A:ci/scripts/console-bundle-budget.mjs; A:ci/scripts/console-no-fixtures.mjs; A:.agents/agents/performance-engineer.md (budget method) | Apps are graph leaves; build-time env; bundle budget raised only by review; no fixtures in dist | adapt | P1 |
| 32 | `standards/code-style.mdx` | F:const/documentation.md (file contract, docblocks); B:adr/0010, 0020, 0032; P:AGENTS.md (file contract); A:.agents/agents/code-standards-steward.md; F:.claude/agents/steward-error.md (typed errors with code + hint) | Operating form of ADR 0006/0007: header fields, TSDoc tags, naming, imports, error classes | adopt | P0 |
| 33 | `standards/testing.mdx` (moves from `guides/testing.mdx`) | B:eng/verify-and-its-limits.mdx; B:adr/0019 (strategy); A:docs/TESTING.md (what a pass means); A:docs/plans/provider-fakes.md; M:docs/progress/e2e-ci.md + A:docs/specs/050-mobile-e2e (axis matrix: viewport, theme, direction); B:patterns/command-table-pattern.md; P:tests/golden/README.md | Tests beside code, fakes instead of secrets, the e2e matrix, three things green can't prove | adapt | P0 |
| 34 | `standards/dependencies.mdx` (moves from `guides/catalogs.mdx`) | B:.agents/rules/versions.md; J:.agents/rules/versions.md; P:pnpm-workspace.yaml (minimumReleaseAge, allowBuilds); P:policy/licenses.yaml; A:policy/licenses.yaml | Versions only in catalogs; toolchain only in `mise.toml`; licence allow-list; release-age gate | adapt | P0 |
| 35 | `standards/i18n-rtl.mdx` | A:ci/scripts/check-rtl.mjs; A:docs/standards/console-conventions.md (RTL section); M:docs/progress/i18n.md; F:adr/0012-i18n.md; A:.agents/agents/i18n-steward.md | Logical properties only, `rtl-physical:` escape hatch, ICU typed keys, no locale literals in packages | adapt: locales defined by apps, not packages | P1 |
| 36 | `standards/ui-and-accessibility.mdx` | A:docs/specs/051-console-canonical-ux-ia/checklist.md; A:docs/specs/056-console-ux-standard/brief.md (§1, 7–10, 15); A:docs/standards/console-conventions.md (overlays); M:docs/research/console-page-patterns.md; M:.opencode/rules/muslin-laws.md (UI rules: 44px, HeroUI-only); M:docs/progress/a11y.md (audit method); J:packages/juristra/brand/tokens/contrast.md (contrast gate); J:…/figentra-brand/compliance/*.md (rule format only); A:.claude/agents/platform-reviewer.md | Reuse, configure, compose, never one-off; tokens only; WCAG 2.2 AA; contrast table generated from tokens | adapt: values stay in each brand's app tree | P1 |
| 37 | `guides/tooling.mdx` (exists; extend) | B:.agents/rules/task-vocabulary.md; J:.agents/rules/task-vocabulary.md; M:package.json scripts; B:eng/polyglot-workspace.mdx; B:architecture/overview.mdx | Every member exposes build/typecheck/lint/test/format/format:check/clean/dev; Turbo is a thin orchestrator | adapt: drop go/uv | P0 |

### Runbooks

| # | proposed Stackra page | sources merged | what it says | action | priority |
| --- | --- | --- | --- | --- | --- |
| 38 | `runbooks/secrets.mdx` | P:rb/secrets.md; P:rb/secrets-rotation.md; P:docs/plans/secrets-sync.md; A:docs/runbooks/integrations-and-secrets.md (per-provider format); A:tools/scripts/secrets/doctor.mjs; A:tools/scripts/secrets/sync-to-encore.sh; B:.gitlab/secrets.yml header | Who sets what, how CI gets a one-step token, rotation by overlap, list names with doctor | adapt: Stackra already has `tools/scripts/mcp.sh` | P0 |
| 39 | `runbooks/ci.mdx` | P:docs/06-local-ci.md; P:rb/ci-locally.md; P:adr/0012; P:.actrc + tests/act/README.md; A:docs/runbooks/ci-fallback.md; A:tools/ci/gate-local.sh; B:eng/what-ci-enforces.mdx; B:tools/scripts/ci/README.md; P:.github/{workflows/gate.yml,verify.yml,actions/setup-toolchain,actions/vault-oidc}; A:.github/actions/{setup,vault-secrets}; P:docs/02-checklists-and-plan.md (A–I); P:docs/research/web-ci-checklist.md; M:.opencode/rules/testing-and-ci.md (lock idea); A:docs/staging.md (structure) | One required check, local parity with zero secrets, a check that can't run is a FAIL, break-glass deploy recorded | adapt: after the code-host decision (row 18) | P0 |
| 40 | `runbooks/release.mdx` | P:rb/release.md; B:.changeset/README.md; P:.changeset/README.md; M:.changeset/config.json; P:.github/workflows/release.yml; P:tools/release/*; A:.github/workflows/release.yml | Version-packages PR, signed publish, immutable tags, recovery | adapt: private packages unless publishing | P1 |
| 41 | `runbooks/mobile-release.mdx` | A:docs/EAS-REACT-NATIVE-PLAYBOOK.md; A:docs/MOBILE-RELEASE.md; A:docs/runbooks/mobile-release.md; P:adr/0007, 0008; P:rb/store-bootstrap.md; P:docs/plans/mobile-automation.md; P:docs/research/mobile-ci-checklist.md; A:docs/adr/0009 (store guideline 4.8 reasoning) | EAS owns build/sign/submit/OTA; human store bootstrap; nine real failure fixes | adapt: strip Academorix values | P1 |
| 41b | `.github/` or `.gitlab/` composite steps (not a page) | P:.github/actions/setup-toolchain; A:.github/actions/setup | pnpm from `packageManager`, frozen install, Turbo cache | adapt: built with row 39 | P0 |
| 42 | `runbooks/renovate.mdx` | P:rb/renovate.md; P:renovate/consumer.json; P:renovate.json5; P:.github/workflows/dependency-review.yml | One-day release age, SHA digests, no automerge, advisories bypass age | adopt | P1 |
| 43 | `runbooks/deploys.mdx` | M:.opencode/rules/deploys.md; A:.github/workflows/backend.yml; P:adr/0004; P:.github/workflows/{deploy,promote,rollback,preview}.yml; P:rb/rollback.md; P:adr/0016 (release records) | Agents prepare, owner runs every deploy; staging then prod; rollback redeploys a recorded artifact | adapt | P1 |
| 44 | `runbooks/upgrade.mdx` | P:rb/upgrade-v1-to-v2.md (checklist pattern); P:docs/releases/v2.0.0.md (major-notes example) | Toolchain, Expo SDK, Encore and preset upgrades as checklists | adapt | P2 |
| 45 | `runbooks/operations.mdx` (deferred page) | P:rb/incident.md; P:rb/slos.md; P:rb/dr.md; P:rb/dr-exercise.md; P:rb/access-review.md; P:rb/break-glass.md + break-glass-log.md; P:rb/slack.md; P:docs/plans/notifications-observability.md; M:infra/ops/* + docs/ops/backups-monitoring.md; B/A:.agents/agents/incident-commander.md | Severities, post-mortem, SLOs, DR drill, quarterly access review, break-glass log | adapt: create when something runs in production | P2 |

### Guides

| # | proposed Stackra page | sources merged | what it says | action | priority |
| --- | --- | --- | --- | --- | --- |
| 46 | `guides/workflow.mdx` (exists; extend) | F:CONTRIBUTING.md; B:CONTRIBUTING.md; P:commitlint.config.mjs; A:lefthook.yml + J/M lefthook.yml (check-only rationale); A:.github/pull_request_template.md; F:.gitleaks.toml header; P:tests/gitleaks/allowlist.test.mjs | Branch naming, conventional commits, changeset per member, check-only hooks, PR template | adapt | P0 |
| 47 | `guides/definition-of-done.mdx` | B:eng/definition-of-done.mdx; P:AGENTS.md (DoD); G:service-checklist.md §8 | Code plus green `pnpm verify` plus docs current plus ADR when a decision changed plus review sign-off | adopt | P0 |
| 48 | `guides/scaffolding.mdx` | B:tools/scaffold/README.md + schemas/template-manifest.schema.json; P:templates/{README,AGENTS}.md + templates/scripts/check.sh; F:tooling/templates/packages/{ts-platform,ts-domain}; A:tools/scripts/new-package.mjs; A:tools/scripts/codemods/move.mjs; A:tools/scripts/structure-inventory.mjs; A:tools/scripts/api-inventory.mjs | `pnpm new`; every template renders and validates in a test; moves are scripted codemods, never hand edits | adapt: document existing `tools/scaffold` | P0 |
| 49 | `development.mdx` (exists; extend) | B:apps/docs/src/runbooks/local-setup.mdx | Clean clone to green: mise, pnpm, Encore, Expo | adapt: drop go/uv | P0 |

### Agents

| # | proposed Stackra page | sources merged | what it says | action | priority |
| --- | --- | --- | --- | --- | --- |
| 50 | `agents/index.mdx` | B:.agents/README.md; B:.agents/rules/README.md; B:eng/agent-governance.mdx; A:.agents/README.md; J:.agents/rules/README.md; B:tools/scripts/agents-sync.mjs; F:CLAUDE.md (`@AGENTS.md`); J:CLAUDE.md; B:AGENTS.md + CLAUDE.md; P:AGENTS.md (non-negotiables); J:AGENTS.md (lean root template) | One `.agents/` tree; neutral rule frontmatter (always / applies_to / manual); CLAUDE.md only imports AGENTS.md | adapt | P1 |
| 51 | `agents/roster.mdx` | A:.agents/agents/README.md (bands, routing, authority matrix); B:.agents/agents/README.md; B:eng/review-and-merge.mdx; per-agent defs listed in section 7; M:.opencode/agent/*; M:.opencode/command/{state,deploy-check}.md | Who blocks versus who reports; gate order; one charter shape | adapt: section 7 is the content | P1 |
| 52 | `agents/hooks.mdx` | J:.agents/hooks/* + .claude/settings.json; A:.agents/hooks/* (prompt-hints, post-write-checks); B:.agents/hooks/guard-paths.mjs; P:.claude/hooks/guard-bash.mjs (+ test); M:.opencode/opencode.jsonc (permission ruleset); G:PHASED_WORKFLOW.md | What each hook denies or reminds; the hook test; settings wiring | adapt | P1 |
| 53 | `agents/skills.mdx` | A:.agents/skills/README.md; B:.agents/skills/README.md | Vendored vs plugin skills, install with `npx skills`, category-prefixed names for house skills, what is deliberately not vendored | adopt | P1 |
| 54 | `agents/spec-lifecycle.mdx` | B:eng/lifecycle-and-specs.mdx; B:eng/discovery-and-product-definition.mdx; B:eng/durable-findings.mdx; F:docs/plans/2026-10-10-spec-review-checklist.md; B:tools/spec/{spec-lint,spec-status}.mjs; A:.agents/specs/034–039 sdlc-*; F:docs/plans/2026-10-04-closure-board.md (concept); P:docs/TASKS.md (one task file rule) | Three docs per spec, one skill per transition, quick-spec, review checklist, where a durable finding goes | adopt: templates come from the sdlc plugin | P1 |
| 55 | `agents/concurrent-sessions.mdx` | J:.agents/rules/concurrent-sessions.md; B/A copies; M:.opencode/rules/git-and-prs.md (fresh worktree, explicit-path staging, `git commit --only`); G:phased-execution.md; J/M:docs/HANDOVER.md (resume structure) | Commands check their own preconditions; establish whose change it is before acting; phases plus handover | adopt | P0 |
| 56 | `agents/rules-that-dont-rot.mdx` | B:eng/writing-rules-that-dont-rot.mdx; B:eng/overview.mdx; A:docs/standards/package.md (standard + checker pairing) | Every rule names its check; a vendored copy needs a drift check | adopt | P1 |

### Repository-root files (not docs pages, but where these rows land)

| # | target | sources | what it says | action | priority |
| --- | --- | --- | --- | --- | --- |
| 57 | `SECURITY.md` | P:SECURITY.md; F:SECURITY.md; B:SECURITY.md | Private reporting, 48h acknowledgement, control list | adapt: contacts | P1 |
| 58 | `CODEOWNERS` | P:.github/CODEOWNERS; B:CODEOWNERS; P:rb/two-person-rule.md (deferred) | Ownership map; two-person rule waits for a second maintainer | adapt | P2 |
| 59 | `.agents/rules/*.md` (new dir) | see section 4 | Short always-on rules that point at the pages above | adapt | P0 |

---

## 4. Where the rule lives besides the docs (P0 and P1 pages)

Existing Stackra enforcement, checked today:

- `tools/scripts/validate-repository.mjs` checks:
  - the `@stackra/*` name;
  - FORBIDDEN_DEPENDENCIES (13 packages);
  - catalog/workspace-only versions;
  - exactly one tier tag in `turbo.json`;
  - that `tsconfig` extends a preset;
  - required files README/AGENTS/CHANGELOG/LICENSE, `## PII`, a LICENSE equal to the root one, `description`, `license: UNLICENSED`, `sideEffects: false`;
  - that exports point at `./src`;
  - that the service unit has `encore.service.ts` + README + AGENTS.
- `packages/tooling/oxlint/base.jsonc` checks: no-explicit-any, consistent-type-imports, no-non-null-assertion, import/no-cycle.
- `packages/tooling/oxlint/boundaries.jsonc` checks: the core/application/presentation layer rules, and that a package never imports an app, a service or `encore.dev`.
- `turbo.jsonc` holds the boundaries tags.
- `lefthook.yml` runs oxfmt --check, oxlint, gitleaks, commitlint and pre-push typecheck.
- `.agents/hooks`:
  - `guard-bash` (13 rules: `encore secret`, `wrangler secret`, `.env` and `.dev.vars` reads, printenv, git clean/reset/checkout, `rm -rf`, force push, version tags, DROP, ORM push/migrate, `changeset version`);
  - `session-context`;
  - `context-health`.
- Other config files: `knip.jsonc`, `.gitleaks.toml`, `commitlint.config.mjs`, `mise.toml`.
- Missing: any CI pipeline file, `.agents/rules/`, `guard-paths`, `post-write-checks`, and any agents projection sync.

| page | also needs | exists in Stackra? |
| --- | --- | --- |
| constitution/boundaries (#2), adr/0003 (#9) | turbo boundaries + oxlint `no-restricted-imports` + validator tier tag; agent rule `.agents/rules/boundaries.md` | **Yes**: turbo tags, validator tier check, oxlint package→app/service ban. **No**: rule file; check for no product literals or `process.env` in packages (port A:package-families.mjs pattern) |
| adr/0004 (#10), standards/packages (#29) | oxlint layer rules; validator for exports and package shape | **Yes**: layer rules and exports→`./src`. **No**: archetype field check (B:adr/0056 `sdlc` key) and a barrel/deep-import check (A:check-package-shape.mjs) |
| adr/0005 (#11) | tsconfig `decorators.json` preset, oxlint `decorators.jsonc` | **Yes** (presets exist; their ADR citations need repointing) |
| adr/0006 (#12), standards/code-style (#32) | file-name and one-export check, import-specifier check (B:tools/scripts/import-style.mjs); code-standards steward | **No**, apart from `consistent-type-imports`. Port `import-style.mjs` into the validator |
| adr/0007 (#13) | doc-standard check for the file-contract header and TSDoc on exports (B:tools/scripts/doc-standard.mjs) | **No**. Headers exist by convention (`lefthook.yml` carries one) |
| adr/0008 (#14), standards/testing (#33) | validator: no root `tests/`, test files only under `src/**/__tests__` or `*.test.ts` | **No**. AGENTS.md states the rule; nothing checks it |
| constitution/secrets (#3), adr/0009 (#15), runbooks/secrets (#38) | guard-bash, gitleaks, a no-`.env` check, secrets-doctor, CI OIDC-only check | **Partial**: guard-bash and gitleaks exist, but guard-bash lacks the `infisical export` / `infisical secrets get` denial that `G:secrets.md` claims exists. **No**: `secrets-doctor`, `secrets-no-dotenv`, CI workflow allowlist |
| constitution/http-and-events (#5), standards/services (#30), adr/0010 (#16) | validator service unit; Encore-only lint for one `api()` per operation; `.agents/rules/http-conventions.md` with `paths: services/**` frontmatter; isolation test once a scoped table exists | **Partial**: service-unit files checked. **No**: rule file, gen-client drift check (`gen:client:check`) |
| adr/0011 (#17) | validator FORBIDDEN_DEPENDENCIES; architecture-guardian | **Yes** (13 packages; extend after re-validation) |
| adr/0012 (#18), runbooks/ci (#39) | the CI pipeline file itself running `pnpm verify` as the single required check; commitlint range; gitleaks | **No**. No CI file exists, and lefthook already claims `.gitlab-ci.yml` is the gate |
| standards/members (#28) | validator required files + PII | **Yes** |
| standards/dependencies (#34) | validator catalog check, `catalogMode: strict`, licence gate, mise pin agrees with `packageManager` (P:tests/pins) | **Yes**: catalog check, strict mode. **No**: licence gate and pin-agreement test |
| guides/tooling (#37) | validator check that every member has the task vocabulary scripts | **No** |
| guides/workflow (#46) | lefthook, commitlint, gitleaks | **Yes** |
| guides/definition-of-done (#47) | `pnpm verify` | **Yes** (`verify` script chains format, lint, typecheck, test, build, validate, boundaries, knip) |
| guides/scaffolding (#48) | scaffold test renders every template and validates it | **Partial**: `scaffold.test.mjs` exists; check that it renders and validates every kind |
| agents/concurrent-sessions (#55) | `.agents/rules/concurrent-sessions.md` (always: true); guard-bash git rules | **Partial**: guard-bash git rules exist. **No**: rule file |
| constitution/tenancy (#6) | RLS catalog audit (A:tools/scripts/rls-audit), isolation-test skill, security-tenancy reviewer | **No**. Not needed until the first tenant-owned table |
| constitution/security (#4) | gitleaks, CodeQL/zizmor/dependency-review in CI, redaction review | **Partial**: gitleaks only |
| constitution/delegation (#7), agents/* (#50–54, 56) | `.agents/rules/` dir + projection sync (agents-sync `--check`), `guard-paths.mjs` refusing writes to projections, hook tests | **No**. Hooks exist without tests; the settings file is hand-wired |
| standards/apps (#31), i18n-rtl (#35), ui-and-accessibility (#36) | check-rtl, bundle-budget, no-fixtures scripts per app; accessibility reviewer | **No** |
| adr/0013 (#19), runbooks/release (#40) | `changeset status` in verify; guard-bash `changeset version` denial | **Partial**: guard-bash denial and `changeset:status` script exist; `changeset:status` is not chained into `verify` |
| runbooks/renovate (#42), mobile-release (#41), deploys (#43) | Renovate preset; EAS workflows; deploy approval in CI | **No** |

---

## 5. Skipped or rejected (one line per group)

### 5a. Skip

- **Business/domain** (all sources): specs, briefs, sales, UAE PASS pack, product plans, legal, product ADRs (A:0003 WhatsApp, A:0006 Pay; J:0003/0005–0008/0010/0011; F:0002/0003/0004/0005/0027/0028/0032), brand values, domain skills. Counted in section 1, not listed.
- **Status or run reports**: B:PACKAGE_QUALITY_STANDARDS_APPLIED, B:migration/*, B:VELLUM_* + MIGRATION_QUICK_START, B:.agents/specs/*REPORT*, B:plans/deferred-work-inventory, B:architecture/plan-conformance, F:.agents/loop/*, F:.agents/briefs/*SUMMARY*, F:docs/plans/{TASKS,week/*,glm-week-plan,spec-review-verdicts}, F:audits, F:todos.md + repomix + steward reports, A:.agents/agents/DESIGN-AGENCY-COMPLETE, A:docs/audits/rls-staging-*, A:.agents/specs/COMPLETION_*. These are history with no rules in them.
- **Superseded**: B:adr/0030 (superseded by 0054); B:adr/0045 (pointer to 0024); F:V4 standards and architecture under `docs/figentra-ollama-demo/**` (superseded by the constitution); F:docs/plans/2026-10-07-package-organization (duplicates F:adr/0033); P:docs/research/superseded-cloud-yaml-v2-draft; A:docs/specs/051/workflow.md (delegation removed); J:.agents/rules/secrets.md (`.env`-era, superseded by G:).
- **Opencode/GLM delegation**: F:adr/0023, A:adr/0001, P:adr/0013, A:.opencode/opencode.jsonc, A:.agents/bin/{run-plan,build-plan,opencode-backlog,linear-*}, A:.agents/briefs/runner/*, A:.agents/bin/{sync-secrets,worktree-deps,restart-when-idle,save-all-worktrees,heavy}.sh, F:.opencode/README + agents/* (generated twins). Obsolete. The lesson goes into adr/0017.
- **Rejected ADRs, kept only as table rows in adr/0011**: F:adr/0036–0039. M:docs/adr/0001 (SDUI app builder) contradicts R7 and is a domain feature.
- **Basalt-specific inventories or layout**: B:adr/0007 (os member list), B:adr/0097-platform-package-organization, B:adr/0097-context-package-analysis, B:adr/0055, B:adr/0057, B:plans/{container-architecture-consolidation,os-package-roadmap}, F:adr/0033 + 0041 (Figentra categories; Stackra has its own 10).
- **Compiler/definition tier**: B:adr/0041, 0042. These are product compiler design.
- **Figentra package-specific designs**: F:adr/0008 router, 0011 query, 0013 devtools, 0014 transport, 0015 signals, 0016 console, 0018 events, 0030 logger. They become a package's own README when the package lands. F:docs/plans/2026-10-05-ecosystem-*.
- **Undecided placeholders**: B:adr/0044 (security boundaries) and B:adr/0050 (observability; its question goes to adr/0020).
- **Overlapping agents**: B:backend-architecture-reviewer and A:backend-architecture-reviewer (duplicate the architecture-guardian); A:.claude/agents/{mobile-builder,service-builder,test-engineer} (duplicates of `.agents` copies); F:.claude/agents/spec-reviewer (sdlc spec-verify covers it).
- **Design agency**: B/A:{design-director,senior-product-designer,figma-design-engineer}, B:.agents/CANVAS-ANALYSIS. Too heavy and unproven; one design-brand reviewer replaces them (section 7).
- **Stack skills that contradict not-built-yet**: A:.agents/skills/{nestjs,drizzle-orm-patterns,go-service,python-service,hono-worker,cloudflare-worker,node-worker,nextjs,react-development,vite-react-development,react-native-development,multi-tenant-safety-checker}; A:.agents/agents/{heroui-*,sanity-*,find-skills} (misplaced copies). Reinstall what Stackra uses from upstream; do not copy.
- **Vendored skill families** (Encore, Expo/EAS, web/HeroUI, monorepo, quality, motion, design-process): reinstall with `npx skills` and record them in `agents/skills`. Never copy them. B:skills/documentation-and-adrs duplicates docs-adr.
- **Duplicated global-rule copies**: J:.agents/rules/{tenancy,module-boundary,not-built-yet,service-checklist,http-conventions,phased-execution,PHASED_WORKFLOW}, A:.agents/rules/{phased-execution,PHASED_WORKFLOW}, M:.opencode/rules/{platform-rules,phased-execution}, M:AGENTS/CLAUDE. G: is the source.
- **Product-only rule**: G:vision.md and A:.agents/rules/vision.md (Vision repo).
- **Product UI kit docs**: F:docs/figentra-ui/docs/* (theming, testing, contributing); A:docs/MOBILE-UI-AUDIT; A:docs/analysis/heroui-pro-native-adoption; M:docs/heroui/CHEATSHEET (use the heroui skills instead); M:docs/research/medusa-*.
- **Single-feature library ADRs**: A:adr/0002 (alternate icons), A:adr/0005 (passkey library, revisit with identity), A:adr/0004 (GuardDuty scanning, revisit with object storage).
- **Product notes in the `/docs/plans` briefs**: A:docs/plans/define-app-example; A:docs/plans/{structure-v2,structure-inventory}.
- **Local or trivial files**: `.vscode/README`, `.claude/README`, `.claude/launch.json`, `.claude/settings.local.json`, `.opencode/{QUICK-REFERENCE,MCP-MIGRATION}`, A:tools/ci/google-fonts-mock, A:tools/scripts/{api-e2e,deploy-frontends,seed-*,ts-resolve}, A:docs/linear-import/*, J:.agents/bin/linear-setup, J/M:heroui-mcp.sh, M:docs/OPENCODE-PROMPTS, J:docs/support-matrix.
- **Pointer lists or generated output**: F:docs/reference/README, F:tooling/scripts/README, F:docs/analysis/*, P:docs/01-research-findings, P:docs/research/{repo-audits,mobile-as-built}, P:docs/providers/README (regenerate if ever needed).
- **Consumer data in the platform repo**: P:terraform/stacks/{academorix,figentra}/**. This contradicts P:adr/0021.
- **Encore-secrets CI writer**: P:.github/workflows/encore-secrets-sync.yml. It conflicts with "a human sets values" until adr/0009 says otherwise.
- **Encore compose from manifests**: P:adr/0014 + P:docs/plans/encore-compose. It is a pilot; A:docs/plans/define-app covers the idea for adr/0018.
- **Data-retention legal content**: M:docs/policies/data-retention. The structure goes to constitution/security only if needed; the content is business.

### 5b. Deferred until a trigger, not rejected

- **Platform manifest, policy-as-data, gate consumption**: P:docs/{03-cloud-manifest-v2.1,04-usage-examples,05-capabilities-catalog}, P:figentra.yaml, P:policy/{policy.yaml,policy.schema.json}, P:schemas/*, P:packages/{manifest,cli,mcp,providers/**}, P:docs/providers/{check,cap,build,deploy,store,infra,hook,kind}-*, P:scripts/bind.*, P:.github/workflows/{schedule,schemas,secrets-roll,gate-self-test}.yml, P:.github/actions/{figentra-cli,run-steps,notify}, A:policy.yaml, A:.github/workflows/ci.yml. **Trigger**: adr/0012 chooses to consume the platform gate. Then the `figentra` names must become neutral first.
- **Terraform**: P:adr/0009/0015, P:terraform/{README,AGENTS,modules,bootstrap,stacks/_*,scripts}, P:docs/research/{env-boundary-review,store-terraform-providers}, P:rb/{terraform-bootstrap,cloudflare-import,records-retention}. **Trigger**: Stackra owns cloud infrastructure.
- **Platform-wide patterns that only make sense with that platform**: P:adr/0003 (manifest), P:adr/0010 (Workers hosting), P:adr/0011 (capabilities), P:docs/research/vendor-integrations, A:tools/ci/ci-local.mjs. **Trigger**: same as the first item.
- **Product-shaped engine briefs**: A:docs/plans/{workflows,api-hooks-generator,define-app}, F:adr/0031 (gates), F:adr/0040 (API docs hosting), F:docs/plans/2026-10-08-master-plan, F:.agents/tasks/new-packages-plan. **Trigger**: the matching `@stackra` package gets a spec.
- **Database reviewer and data docs**: A:.agents/skills/db-schema-comments, A:.agents/agents/{database-engineer,sql-reviewer}, A:tools/scripts/rls-audit/*, A:.agents/skills/security-tenancy-isolation-test. **Trigger**: the first Stackra service with a `SQLDatabase`. Port them then into standards/services and the roster.

---

## 6. Conflicts that need a human decision

| # | conflict | recommended answer |
| --- | --- | --- |
| 1 | **Test placement.** B:adr/0019 says a root `tests/` mirroring `src`. B:adr/0034, Stackra AGENTS.md and the user's decision say `src/**/__tests__`. M:e2e-ci puts e2e in a separate `tests/e2e` workspace. | `src/**/__tests__`, or `*.test.ts` beside the file. App e2e stays inside the app (`apps/<app>/e2e`). Add a validator check. |
| 2 | **ADR numbering and dangling citations.** Stackra cites ADR-0007 (Figentra's DI), ADR-0026 (Figentra's archetypes), ADR-0034 (Figentra's roster), Basalt ADR-0004 and Basalt ADR-0029 in `packages/tooling/*` and `lefthook.yml`. Stackra has only 0001–0002. | Renumber from 0003 as in section 3. Keep a "previously cited as" line in each new ADR (e.g. 0005 = "was Figentra ADR-0007"). After the agent editing `packages/tooling` finishes, rewrite the citations in one commit. |
| 3 | **`~/.claude/rules` cite Basalt ADRs that don't exist in the archive.** The rules cite 0071, 0077, 0083, 0084, 0085, 0090, 0091, 0160 and 0169; only 0033 exists. They also cite `apps/docs/src/constitution/` and `packages/os/*`, `@figentra/*` and `services/<product>`, which Stackra doesn't have. | Treat Stackra as the new source of truth. Port the content into the pages above, then a human updates the global rules to cite Stackra page paths (not numbers). Until then a Stackra page wins where they differ. |
| 4 | **Code host and CI.** Stackra's `lefthook.yml` and B/F say GitLab. A/P/M use GitHub Actions, and P has a finished OIDC gate plus SHA-pin tests. No CI file exists. | GitHub. The working gate, `vault-oidc`, the pin tests and A's setup action already exist, and A:ci/README keeps logic in pnpm scripts so moving later is cheap. Record it in adr/0012 and fix the lefthook comment. |
| 5 | **Law hierarchy.** F has a constitution with laws above ADRs. B has ADRs only, with principles in 0025. P has a constitution only for secrets. | F's model: `constitution/` holds laws, ADRs refine them, and each law names its check. |
| 6 | **Package shape.** B's four layers (core/application/infrastructure/presentation, already enforced by Stackra's oxlint) vs F's entry folders (contracts/core/react/native/node) vs A's minimal `src/{index,contracts,core}`. | B's four layers plus archetypes, because they are already enforced. F's host entries become `presentation/{react,web,native}` and a `node` entry, and A's minimal shape becomes the "flat lib" archetype. |
| 7 | **Roster names and bands.** The sdlc plugin uses names like `architecture-guardian` and `code-reviewer`. A uses bands (Builder/Reviewer/Officer/Steward/Ops), F uses `steward-*` and `auditor`, and M uses `coordinator`/`reviewer`. | The sdlc plugin names are canonical and are not duplicated in the repo. New agents use `<domain>-<role>` kebab names with the section 7 tiers. F's stewards fold into existing roles. |
| 8 | **Model assignment.** F:adr/0034 says Opus designs, Sonnet implements, Haiku stewards; its amendment moved everything to GLM-5, which was later retired. A:models.json has agents declare a tier. | Agents declare a tier, and `.agents/models.json` maps tier to model. Opus for guardians and the orchestrator, Sonnet for executors and reviewers, Haiku for mechanical stewards. Claude-only. |
| 9 | **Secrets enforcement gap.** `G:secrets.md` says guard-bash denies `infisical export` and `infisical secrets get` without `--silent`. Stackra's guard-bash has no Infisical rule. | Add both rules to guard-bash in the same change that ports constitution/secrets, and add a hook test. |
| 10 | **Tenancy scope.** The global rules mandate two-layer tenancy everywhere and name `scopedTable()` in `packages/codegen`, while J:0004 and ADR-0077 talk of a MikroORM scoped entity. Stackra has no tenant tables yet. | Port the law now as P1 with the trigger "first tenant-owned table". Name the mechanism (MikroORM scoped entity) in adr/0014, not in the law. |
| 11 | **Spec location and templates.** Specs live in `.agents/specs` (B), `.claude/specs` (B's CLAUDE.md, stale) or `docs/specs` (A). Templates are copied (A, B) or come from the plugin. | `.agents/specs/<NNN>-<slug>/` with exactly three docs. Templates come from the sdlc plugin and are not copied. |
| 12 | **Placement in the docs site for `guides/standards`, `testing` and `catalogs`.** These are normative pages sitting in `guides/`. | Move them to `standards/` (rows 28, 33, 34) with Mintlify redirects. Do it after the current editor finishes `guides/standards.mdx`. |
| 13 | **context-health hook.** G says it nudges every 10 calls; J notes it relies on `CLAUDE_TOOL_CALL_COUNT`, which may never be set. | Test whether it fires in Stackra. If it doesn't, count calls in a temp file or delete the hook. Fold phased-execution guidance into agents/concurrent-sessions. |
| 14 | **Two-person rule.** P makes two required reviewers for production a gate. Stackra has one maintainer. | Defer: CODEOWNERS now, two-person rule when a second maintainer joins (row 58). |
| 15 | **Design agents.** B skips the design agency; A adapts design-systems-designer and design-critic. | One `design-brand-reviewer` (report, non-blocking) plus the design skills. No design agency. |

---

## 7. Agent roster proposal for Stackra

Model is the tier default (conflict 8). No role is assigned to `fable`, because there is no evidence yet for where it fits. Revisit after a trial.

| agent | tier | model | blocks? | owns | source definition to adapt | status |
| --- | --- | --- | --- | --- | --- | --- |
| delivery-orchestrator | lead/orchestrator | opus | enforces gate order; writes no code | classify work, route, task graph, status; absorbs F:brief-author and F:sweeper | B/A:.agents/agents/delivery-orchestrator.md; M:.opencode/agent/coordinator.md | **exists** (sdlc) |
| architecture-guardian | guardian-blocking | opus | yes | tiers, layers, placement, not-built-yet, writes the missing ADR | B/A:architecture-guardian.md | **exists** (sdlc) |
| security-tenancy-reviewer | guardian-blocking | opus | yes | auth, secrets, isolation, webhooks, SSRF, redaction of secrets and PII from logs, events and errors | A:security-tenancy-reviewer.md + B:security-compliance-reviewer.md + F:steward-redaction.md + B/A:security-lead.md (advisory part) | **new** (P0) |
| release-operations | guardian-blocking | sonnet | yes; a human approves every release and deploy | CI, pins, release flow, changesets; absorbs docs-changesets-steward | B/A:release-operations.md, docs-changesets-steward.md; M:deploys.md | **exists** (sdlc) |
| test-engineer | guardian-blocking | sonnet | yes, on red or untested failure path | verification levels, e2e matrix; absorbs e2e-test-engineer and F:steward-test | B/A:test-engineer.md, e2e-test-engineer.md; M:.opencode/agent/test-engineer.md | **exists** (sdlc) |
| package-steward | steward (blocks new package or subpath) | sonnet | yes, on a new package or subpath | archetype, layers, exports, barrels, provenance (`ORIGIN.md`) | B/A:package-steward.md | **exists** (sdlc) |
| dependency-steward | steward | haiku | only on an open critical advisory | catalogs, licences, mise pins, Renovate, `.mcp.json`, skills | B/A:dependency-steward.md | **exists** (sdlc) |
| accessibility-reviewer | reviewer (blocks critical/serious) | sonnet | critical/serious only | WCAG 2.2 AA, web and native, LTR/RTL, contrast | B/A:accessibility-reviewer.md | **exists** (sdlc) |
| code-reviewer | reviewer | sonnet | no | correctness, simplicity, reuse, altitude | B/A:code-reviewer.md; M:.opencode/agent/reviewer.md | **exists** (sdlc) |
| api-contract-reviewer | reviewer | sonnet | no (escalates to the guardian) | `api()` shape, prefixed ids, pagination, idempotency, gen-client drift | A:api-contract-designer.md | **new** (P1) |
| design-brand-reviewer | reviewer | sonnet | no | reuse-first UI checklist, tokens only, brand rules; PASS/BLOCK advice | A:.claude/agents/platform-reviewer.md + A:design-critic.md + A:design-systems-designer.md | **new** (P1) |
| performance-engineer | reviewer | sonnet | no | budgets (bundle, API p95, mobile TTI) and budget tests | B/A:performance-engineer.md | **new** (P2) |
| sql-reviewer | reviewer | sonnet | yes, once a database exists | query plans, indexes, migration cost, RLS | A:sql-reviewer.md + A:database-engineer.md + B/A:data-lead.md | **new** (P2, deferred) |
| docs-governance | steward | sonnet | no | the canon: docs, ADRs (absorbs docs-adr-steward), AGENTS/CLAUDE, rules, roster; docs-code drift; absorbs F:steward-docs-sync | B/A:docs-governance.md, docs-adr-steward.md | **exists** (sdlc) |
| code-standards-steward | steward | haiku | no | naming, one declaration per file, imports, file contract and docblocks, typed errors, house helpers over hand-written ones | B/A:code-standards-steward.md + F:steward-docblock.md + F:steward-error.md + F:steward-support-helper.md | **new** (P0) |
| i18n-steward | steward | haiku | no | logical CSS, ICU keys, locale data supplied by apps | A:i18n-steward.md | **new** (P1) |
| privacy-officer | officer | opus | yes, on new PII without a PII-table row | PII tables, retention, residency, consent | A:data-protection-officer.md | **new** (P2) |
| incident-commander | officer | opus | no; runs the incident | pipeline, release and leaked-secret incidents, post-mortems | B/A:incident-commander.md; P:rb/incident.md | **new** (P2) |
| spec-author | executor | opus | no | requirements.md, design.md | B/A/F:spec-author.md | **exists** (sdlc) |
| spec-planner | executor | sonnet | no | tasks.md and wave graph | B/A:spec-planner.md | **exists** (sdlc) |
| spec-executor | executor | sonnet | no | exactly one task, cap 5 in parallel | B/A/F:spec-executor.md | **exists** (sdlc) |
| service-builder | executor | sonnet | no | one Encore service change plus tests from a brief | A:.agents/agents/service-builder.md; M:.opencode/agent/service-builder.md | **new** (P1) |
| frontend-builder | executor | sonnet | no | console and docs screens on the generated client | A:frontend-builder.md + A:.claude/agents/console-builder.md | **new** (P1) |
| mobile-builder | executor | sonnet | no | Expo screens, HeroUI Native + Uniwind | A:.agents/agents/mobile-builder.md | **new** (P1) |
| auditor | executor (read-only) | haiku | no | evidence reports for a reviewer or human | F:.claude/agents/auditor.md | **new** (P2, optional) |

Folded away, not created:

- **Absorbed into existing roles**: backend-architecture-reviewer (into the guardian), docs-adr-steward and docs-changesets-steward, e2e-test-engineer, brief-author, sweeper, the steward-* agents, spec-reviewer (into sdlc spec-verify) and merge-train (into release-operations).
- **Not ported**: product-agent (business intake) and ai-agents-builder (comes back with adr/0021).

Totals: 12 roles already exist in the `sdlc` plugin and need only a mention in `agents/roster`. 13 are new; 2 of them are P0 (security-tenancy-reviewer, code-standards-steward).
