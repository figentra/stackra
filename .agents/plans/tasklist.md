# Stackra — Master Task List

Single source of truth for outstanding work. Sources: Phase 1 plan, 15 agent reports from the
2026-10-19 parallel execution session, and user requests in chat.
Rule: check items off only when verified (gate green / applied on GitHub / file confirmed).

---

## 1. Phase 1 — P0 foundation (gate → commit → push)

- [x] CI workflow + CODEOWNERS + branch-protection spec (`.github/`)
- [x] Agent rules in `.agents/rules/`
- [x] Constitution P0 pages + nav fix
- [x] ADR citation sweep — zero stray citations
- [x] Broken standards links removed (`mint broken-links` green)
- [x] `agents-sync.mjs` trimmed to claude+opencode — 34/34 tests
- [x] Guard hooks: Infisical/.env/encore rules, generated-file protection, context-health scrubbed — 73/73 tests
- [x] `@stackra/brand` package — 11/11 tests, validator green
- [x] ADR 0022 test placement — all tests in `__tests__/`, zero violations (find-verified)
- [x] docs.json: ADR 0013–0021 wired into Architecture nav (0001→0022 full order) + stale runbook line fixed — `mint validate` green
- [ ] Social preview asset 1280×640 (agent running)
- [x] Fix hooks-test glob in validate wiring (done in user commit `52f15f6`)
- [x] Commit `52f15f6` landed mid-flight (user/parallel session) — swept all agent work; gate must still verify it
- [x] `pnpm agents:sync` run — 23 projections generated (8 claude agents, 6 claude hooks, 8 opencode agents, AGENTS.md rules block); `agents:check` green, zero drift
- [x] `service-builder.md` reference — self-resolved once `.opencode/` existed
- [x] **GATE GREEN** (sweep agent): `pnpm verify` exit 0 — 37/37 turbo tasks, 56+73 tests, boundaries + knip clean. Re-run after current wave lands, then commit
- [ ] Conventional commit of all Phase 1 work (includes user-side `.old/` removal)
- [ ] Push → confirm CI **Quality Gate** posts green on GitHub (first run)

## 2. GitHub repo settings

- [x] Repo public · branch protection applied (Quality Gate + 1 code-owner review + linear history)
- [ ] **Upload social preview** — manual (no API); asset at `.github/social-preview.png`
- [x] Enable Code Quality scanning (enabled by user in UI)
- [x] Secret scanning + push protection (enabled + verified via API)
- [ ] Code scanning default setup — API POST 404 after 3 attempts (propagation or token missing `security_events` scope). **Manual: Security tab → Code scanning → Set up → Default** (GET confirms repo eligible, languages detected)
- [x] **`.old/` decided: REMOVED** — deletion in progress in working tree (user); commit it forward
- [x] Repo polish: description + 8 topics set (`encore expo infisical mintlify monorepo pnpm turborepo typescript`)

## 3. Infisical & secrets

- [x] init + tokens + `.infisical.json` completed per docs + `$schema` audit (all good; no official schemas where missing → correctly omitted)
- [x] **`.infisical.yaml` created + value-verified** (hand-written per docs; CLI 0.43.136 too old for `migrate-config`)
- [x] CLI pin checked — infisical is **brew-managed**, not mise-pinned (mise.toml pins only node/pnpm/gitleaks; nothing to change). **User: `brew upgrade infisical`** → 0.44.2 → confirm it reads `.infisical.yaml` → then remove `.infisical.json`
- [x] Wrap root scripts — **correctly skipped per ADR-0009**: no root script consumes secrets (`mcp.sh` is the only `/agents` reader); wrapping verify/tests would violate the ADR
- [ ] Phase 2: CI OIDC → Infisical `/ci`

## 4. Tooling decisions (all inventories complete ✅)

**spec-kit** → [x] **REJECTED** (sdlc plugin is the spec engine; recorded)

**MCP servers** (union of 30 found; current repo has 15):

- [x] **FIX `resend`** — `--api-key=$RESEND_API_KEY` applied
- [x] MCP servers: `infisical` (universal-auth, masked, read-only) + `infisical-docs` added; `sentry` was already present — **21 servers total**. ⚠️ `infisical` server needs `INFISICAL_AGENTS_CLIENT_ID/SECRET` in vault `/agents` (env dev) or it alone fails at launch
- [ ] P1 when services exist: `encore-mcp`, `encore-local`, `encore-local-sse`, `encore-cloud`
- [x] Skip: `gitlab` (GitHub now), `next-devtools`, `astro-docs`, `bullmq`; `aws-docs` optional-skip

**Claude plugins** (sdlc already enabled project-scope):

- [x] Enabled: `encore-skills@encore-skills` (31 Encore skills, marketplace declared), `frontend-design@claude-plugins-official`, `code-review@claude-plugins-official` — all ids verified against local checkouts (note: `figma@claude-plugins-official` was already enabled by parallel session — kept)
- [x] Keep Vercel plugin disabled (no Vercel hosting)

**Connectors** (claude.ai already: Claude Docs, Linear, Slack, Shopify):

- [x] Sentry — already present in `.mcp.json` (`https://mcp.sentry.dev/mcp`, OAuth); optional claude.ai connector remains a manual click
- [x] Skip Figma/Notion/etc. — nothing in repo requires them

**Agents** (8 local + 12 via sdlc plugin already):

- [x] P1 first wave ported: `docs-adr-steward`, `docs-changesets-steward`, `incident-commander` (stackra conventions: tier frontmatter, de-branded, GitHub/Infisical paths)
- [ ] P1 when domain lands: `database-engineer` + `sql-reviewer` (MikroORM), `ai-agents-builder` (ADR-0021), `performance-engineer`, `data-protection-officer`, design family (7 agents)
- [x] Skip: `api-contract-designer` (have reviewer), `security-compliance-reviewer` (renamed), `product-agent` (figentra-specific); `e2e-test-engineer` conflicts with ADR 0022 — rewrite when Playwright lands

**Hooks** (5 in stackra, all rewritten, 73/73 tests):

- [x] REJECT `context-health.mjs` (broken by design — reads never-set env var; already deleted)
- [x] `prompt-hints.mjs` ported with stackra keywords (endpoint/secret/adr/changeset/test/version/service/brand/orm/placement/boundary), wired UserPromptSubmit — 99/99 hook tests

**Workflows** (ci.yml only):

- [x] `release.yml` ported — changesets/action@v2 (version-script `changeset:version`, publish-script `changeset git-tag` — tags-only, all members private), CycloneDX SBOM artifact (verified locally), protected `release` environment, no OIDC per Phase 2. ⚠️ Human prerequisite: create protected `release` environment (main-only) + allow workflow token to create PRs
- [x] Skip `codeql.yml` — GitHub default code-scanning setup covers it
- [ ] Later: vellum tag-driven OIDC npm-publish pattern (when publishing packages)

**Commands:** [x] `/verify` + `/sync` created in `.claude/commands/`

## 5. Branding

- [x] Decision + `@stackra/brand` created and green
- [ ] P1: wire `@stackra/brand` tokens into console/mobile/docs

## 6. Later / explicitly deferred (P1+)

- [x] P1 docs port — **all tabs complete**: constitution +3 pages nav'd (security, tenancy, delegation); standards +`ui-and-accessibility` ported (synthesized from surviving A11Y-PATTERNS — original 6 sources absent from `.old/old/`) + `i18n-rtl` nav'd + 2 references restored; guides/runbooks/agents nav wired. `mint broken-links` + `mint validate` green
- [ ] `lefthook.yml` ADR-0017 citation re-eval vs `agents/concurrent-sessions`
- [ ] PostgreSQL + MikroORM (P1) · Expo SDK 57 mobile (P1) · EAS (Phase 2) · Playwright e2e (P1)

---

**Blocked on user (manual):** social preview upload · code scanning one-click (Security tab → Set up → Default) · `brew upgrade infisical` → confirm YAML → remove `.infisical.json` · `INFISICAL_AGENTS_CLIENT_ID/SECRET` into vault `/agents` · create protected `release` environment (main-only) + allow workflow-token PRs (release.yml prerequisites).
**Blocked on agents (1 running):** social preview asset.
**Coordinator endgame:** `pnpm agents:sync` (3 new agents + prompt-hints projections — 7 drift expected) → `agents:check` → `pnpm verify` → commit → push → verify Quality Gate on GitHub.
