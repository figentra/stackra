# Stackra — Master Task List

Single source of truth for outstanding work. Source: Phase 1 plan (`.agents/plans/decisions.md`),
agent reports from the 2026-10-19 parallel execution session, and user requests in chat.
Rule: check items off only when verified (gate green / applied on GitHub / file confirmed).

---

## 1. Phase 1 — P0 foundation (gate → commit → push)

- [x] CI workflow + CODEOWNERS + branch-protection spec (`.github/`)
- [x] Agent rules in `.agents/rules/` (6 files)
- [x] Constitution P0 pages + nav fix (`apps/docs/src/constitution/`)
- [x] ADR citation sweep — zero stray citations (ADR-0007→0005 in tooling presets, lefthook GitLab→GitHub)
- [x] Broken standards links removed (`mint broken-links` green)
- [x] `agents-sync.mjs` trimmed to claude+opencode, filter bug fixed, 34/34 tests pass
- [ ] Guard hooks finalize (agent running)
- [ ] `@stackra/brand` package finalize (agent running)
- [ ] **Run `pnpm agents:sync`** — generate 16 missing `.claude/hooks/*` + `.claude/agents/*` projections (found by agents:check)
- [ ] **Fix broken reference** in `.agents/agents/service-builder.md` → nonexistent `.opencode/` (found by agents:check lint)
- [ ] **Run full gate:** `pnpm verify` + `pnpm agents:check` — must be green
- [ ] Conventional commit of all Phase 1 work
- [ ] Push → confirm CI **Quality Gate** runs and posts green on GitHub (first run)

## 2. GitHub repo settings

- [x] Repo public (`figentra/stackra`)
- [x] Branch protection applied via API (Quality Gate + 1 code-owner review + linear history; `enforce_admins: false`)
- [ ] Social preview image 1280×640 from brand kit (agent generating → `.github/social-preview.png`)
- [ ] **Upload social preview** — manual, Settings → General → Social preview (no GitHub API exists)
- [ ] Enable GitHub Code Quality scanning (user approved — Settings → Code quality → Enable; expect AI-generated coverage-workflow PR)
- [ ] Enable Advanced Security: secret scanning + push protection + code scanning (user approved — free on public repos; complements gitleaks/zizmor decision)

## 3. Infisical & secrets

- [x] `infisical init` → `.infisical.json` (project `dd4724f4…`, EU, dev env, `main→staging`)
- [x] Populate `/agents` folder with real tokens
- [ ] `$schema` + full required/recommended attributes in `.infisical.json` per official project-config docs (agent running)
- [ ] `$schema` audit sweep — apply to remaining config files after parallel agents finish (audit report pending)
- [ ] Wrap root `package.json` scripts with `infisical run --path …` — ONLY scripts that consume secrets (not build/lint/test); after agents-sync agent releases package.json
- [ ] Phase 2: CI OIDC → Infisical `/ci` (deferred per decisions)

## 4. Tooling proposal — awaiting discovery agents (3 running)

Deliver approval tables in chat, then implement after user sign-off:

- [ ] MCP servers table (inventory running: all `.mcp.json` across old repos + `tools/scripts/mcp.sh`)
- [ ] Claude plugins + connectors table (research running)
- [ ] Agents / hooks / workflows / commands tables (inventory running)
- [ ] **spec-kit decision** — adopt P0 / defer P1 / reject (recommendation pending from research agent)

## 5. Branding

- [x] Decision: per-project kits stay central source of truth; repo vendors via `@stackra/brand`
- [x] `@stackra/brand` package created (agent — typechecks)
- [ ] Brand package final report + README review (agent running)
- [ ] Later: wire `@stackra/brand` tokens into console/mobile/docs (P1)

## 6. Later / explicitly deferred (P1+)

- [ ] P1 docs port (22 topics) per `docs-port-inventory.md` — incl. `standards/ui-and-accessibility` (re-add the two references removed in apps.mdx/testing.mdx when the page lands)
- [ ] ADRs 0013–0021 already in nav (confirmed wired)
- [ ] `lefthook.yml` ADR-0017 citation — re-evaluate vs `agents/concurrent-sessions` ref (flagged by citation agent)
- [ ] Stale mentions of "lefthook.yml still says .gitlab-ci.yml" in `runbooks/ci.mdx` + `adr/0012` — now inaccurate, update
- [ ] PostgreSQL + MikroORM (P1), Expo SDK 57 mobile app (P1), EAS (Phase 2), Playwright (P1)

---

**Blocked on user (manual):** social preview upload · Code Quality + Advanced Security toggles (approved, need clicks).
**Blocked on agents:** 8 running at last count (see chat status table).
