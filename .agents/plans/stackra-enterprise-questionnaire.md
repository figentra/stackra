# Stackra Enterprise Day-1 Configuration Questionnaire

**Purpose:** Configure Stackra as a production-ready, enterprise-grade monorepo with scalable architecture, environment management, secrets handling, and licensed packages before starting development.

**Instructions:** Review each question. Default answers with recommendations are pre-filled. Adjust only what you disagree with. This covers all decisions needed to go from setup to first production deployment.

---

## Section A: Project Management & Team Structure

### A1. Project Management Tool
**Question:** Which project management tool will govern development workflow and act as the gate before any development starts?

**Default Answer:** `Linear`

**Recommendation:** Linear (via MCP at `https://mcp.linear.app/mcp`) for issue tracking, sprint planning, and the pre-development gate. Linear's API-first approach integrates cleanly with CI/CD and agent workflows.

**Options:**
- Linear (Recommended) - Modern, API-first, excellent automation
- Jira - Enterprise standard, heavy but comprehensive
- GitHub Projects - Native to GitHub, lightweight
- Asana - Good for mixed technical/non-technical teams

**Your Decision:** [ ] Linear [ ] Jira [ ] GitHub Projects [ ] Other: _______

---

### A2. Team Roster & Roles
**Question:** What roles exist in your team structure? (Select all that apply)

**Default Answer:** Solo developer + automated agents

**Recommendation:** Based on `.agents/models.json` tiers (steward, executor, reviewer, guardian, lead), use agent-assisted workflow:
- You: Lead developer + architecture decisions
- Atlas (Opus tier): Architecture guardian, security reviewer, complex planning
- Sonnet tier: Code reviewers, test engineers, spec executors
- Haiku tier: Quick checks, formatting, minor tasks

**Agent Roles to Add:**
- [x] `release-operations` (deploys, versioning)
- [x] `dependency-steward` (renovate, catalog updates)
- [x] `security-tenancy-reviewer` (tenant isolation tests)
- [x] `code-standards-steward` (lint/rules enforcement)
- [ ] `design-brand-reviewer` (UI/UX consistency) - P1
- [ ] `service-builder` (Encore service scaffolding) - P1
- [ ] `frontend-builder` (Vite app scaffolding) - P1
- [ ] `mobile-builder` (Expo app scaffolding) - P1
- [ ] `api-contract-reviewer` (API versioning) - P1
- [ ] `i18n-steward` (internationalization) - P2

**Your Additional Roles:** _______________________________________________

---

### A3. Code Review Policy
**Question:** Who must approve production deployments?

**Default Answer:** Single maintainer with CODEOWNERS enforcement (+ automated gate checks)

**Recommendation:** Since you're solo currently:
1. CODEOWNERS file: `* @akouta` (you must approve all changes)
2. Branch protection: `main` requires passing checks + 1 reviewer (you)
3. Automated gates: `pnpm verify` must pass (typecheck, lint, test, build, validate, boundaries, knip)
4. Defer two-person approval until a second maintainer joins (ADR-0021 conflict #14)

**Options:**
- Single maintainer + automated gates (Recommended for solo)
- Two-person approval (Enterprise standard, impossible solo)
- Auto-merge with green CI (Risky, no human review)

**Your Decision:** [ ] Single + gates [ ] Two-person (defer) [ ] Auto-merge

---

## Section B: Environment & Secrets Management

### B1. Secret Management System
**Question:** Which secret management system will Stackra use?

**Default Answer:** Infisical (via OIDC for CI, `/agents` endpoint for local dev)

**Recommendation:** Infisical provides:
- **Two mechanisms** (ADR-0009):
  1. App secrets: `encore.secret()` for Encore backend services (stored in Encore's secret manager)
  2. Dev/CI secrets: Infisical with OIDC authentication, vault structure:
    - `/agents` - Developer and agent tokens (local dev)
    - `/ci` - CI/CD deployment secrets (staging|prod)
    - `/services/backend` - Service-specific secrets per environment
    - `/apps/*` - App-specific secrets (mobile API keys, etc.)
- **Zero local .env files** - All secrets injected via `infisical run` or MCP vault wrapper
- **Enforcement:** `guard-bash.mjs` blocks commands without vault wrapper

**Recommended `.infisical.json`:**
```json
{
  "workspaceId": "<YOUR_WORKSPACE_ID>",
  "defaultEnvironment": "dev",
  "gitBranchToEnvironmentMapping": { "main": "staging" },
  "domain": "https://eu.infisical.com"
}
```

**Your Decision:** [ ] Infisical (Recommended) [ ] HashiCorp Vault [ ] AWS Secrets Manager [ ] Other: _______

---

### B2. Environment Configuration Strategy
**Question:** How will you manage environment variables and configuration across local, CI, staging, and production?

**Default Answer:** Environment injection via Infisical, no `.env` files in repo

**Recommendation:**
1. **Local development:** All commands wrapped with `infisical run` or MCP vault script
2. **Root `package.json` scripts:** Already configured to use Infisical:
   ```json
   {
     "scripts": {
       "dev": "infisical run -- turbo run dev",
       "build": "infisical run -- turbo run build",
       "verify": "infisical run -- turbo run format:check lint typecheck test build && pnpm validate && pnpm boundaries && pnpm knip"
     }
   }
   ```
3. **Service configs:** Each Encore service reads from `encore.secret()` or Infisical `/services/backend/<env>`
4. **App configs:** Mobile console reads from Infisical `/apps/mobile/<env>` or build-time replacements
5. **Validation:** `guard-paths.mjs` blocks writes to `.env`, `.env.local`, `.env.*`

**Enforcement Points:**
- `guard-bash.mjs`: Blocks bare `infisical export` or `infisical secrets get` without `--silent` flag
- `guard-paths.mjs`: Blocks writes to `.env` files
- `.gitleaks.toml`: Scans for accidental secret commits
- `lefthook.yml`: Pre-commit secret scan

**Your Decision:** [ ] Injected via Infisical [ ] .env files (violates ADR-0009) [ ] Kubernetes secrets [ ] Other: _______

---

### B3. MCP Server Secret Management
**Question:** How will you manage secrets for MCP servers (Linear, GitHub, Stripe, HeroUI Pro, etc.)?

**Default Answer:** Infisical `/agents` folder, accessed via `tools/scripts/mcp.sh` vault wrapper

**Recommendation:**
1. **All token-based MCP servers** use `.mcp.sh` wrapper that fetches tokens from Infisical
2. **OAuth-based servers** (Expo, Sanity, Cloudflare docs) use HTTP endpoints without tokens
3. **Licensed servers** (HeroUI Pro) use `$HEROUI_PERSONAL_TOKEN` from Infisical
4. **Current `.mcp.json` config:** Already has vault wrapper for token servers
5. **Never commit tokens** - `guard-bash.mjs` enforces vault-only access

**Required secrets in Infisical `/agents`:**
- `LINEAR_API_KEY` (already configured as HTTP MCP)
- `GITHUB_PERSONAL_ACCESS_TOKEN` (for GitHub MCP)
- `HEROUI_PERSONAL_TOKEN` (for HeroUI Pro MCP)
- `STRIPE_SECRET_KEY` (for Stripe MCP)
- `CONTEXT7_API_KEY` (for Context7 MCP)
- `RESEND_API_KEY` (for Resend MCP, optional)

**Your Decision:** [ ] Vault wrapper (Recommended) [ ] Direct tokens in .mcp.json (NOT ALLOWED) [ ] Environment variables (less secure) [ ] Other: _______

---

## Section C: Licensed Packages Management

### C1. HeroUI Pro License Management
**Question:** How will you manage HeroUI Pro licenses across local, CI, EAS builds, and Encore deployments?

**Default Answer:** Single license key in Infisical, injected at build/runtime via environment

**Recommendation:**
1. **HeroUI Pro Native** - React Native components (Uniwind-based):
   - Local dev: `HEROUI_PERSONAL_TOKEN` from Infisical `/agents` → `mcp.sh` wrapper → `.mcp.json`
   - CI: Same token via Infisical `/ci` environment
   - EAS builds: Inject via `eas.json` `env` mapping from Infisical
   - Runtime: HeroUI Pro components validate license on first render

2. **HeroUI Pro React** - Web components (already in `@heroui/react` catalog):
   - Same token works for both Pro React and Pro Native
   - MCP server provides component documentation and examples

**Implementation:**
- Store `HEROUI_PERSONAL_TOKEN` in Infisical `/agents` for local dev
- CI/EAS reads from `/ci` or `/apps/mobile/production`
- Never hardcode in `app.json` or `eas.json` - use environment injection

**Your Decision:** [ ] Infisical-injected (Recommended) [ ] EAS secrets (EAS build secrets UI) [ ] Environment variables in CI [ ] Other: _______

---

### C2. Uniwind Pro License Management
**Question:** How will you manage Uniwind Pro (Tailwind CSS v4 for React Native) licenses?

**Default Answer:** Uniwind is MIT-licensed, Pro features via `uniwind.pro` subscription token

**Recommendation:**
1. Uniwind base is open source (MIT), Pro is subscription-based
2. Token stored in Infisical `/agents` as `UNIWIND_PRO_TOKEN`
3. Injected via `uniwind.config.ts` or environment at build time
4. Mobile app reads from Infisical `/apps/mobile/<env>` for Pro features

**Your Decision:** [ ] Infisical-injected (Recommended) [ ] Hardcoded (NOT ALLOWED) [ ] Other: _______

---

### C3. EAS Build & Submission Secrets
**Question:** How will you manage EAS build secrets (Apple credentials, Google Play keys, app signing)?

**Default Answer:** EAS Secrets Manager synced from Infisical

**Recommendation:**
1. **EAS secrets don't store values directly** - they reference Infisical paths
2. `eas.json` defines secret references, not values:
   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_APP_VARIANT": "production",
           "HEROUI_PERSONAL_TOKEN": { "secret": "HEROUI_PERSONAL_TOKEN" }
         }
       }
     }
   }
   ```
3. **Credentials:** Apple certificates and Google Play keys managed by EAS (preferred) or stored in Infisical `/apps/mobile/credentials`
4. **App signing:** Let EAS manage signing keys (automatic) unless you need manual control

**Your Decision:** [ ] EAS-managed (Recommended) [ ] Infisical + EAS secrets [ ] Manual credentials [ ] Other: _______

---

### C4. Encore Deployment Secrets
**Question:** How will you manage secrets for Encore backend deployments (staging, production)?

**Default Answer:** Encore secrets manager synced from Infisical

**Recommendation:**
1. **Each Encore service has its own secret namespace** in `/services/backend/<env>`
2. **Encore CLI reads from Infisical** during `encore run` or `encore deploy`:
   - Local: `infisical run -- encore run` (reads from `/agents`)
   - CI: `infisical run --env=staging -- encore deploy` (reads from `/ci`)
3. **App secrets** defined in `encore.app`:
   ```go
   var appSecrets struct {
     DatabaseURL     string
     StripeSecretKey string
   }
   ```
4. **Sync mechanism:** Infisical → Encore secrets manager via CI pipeline

**Your Decision:** [ ] Infisical-synced (Recommended) [ ] Encore secrets UI only [ ] Kubernetes secrets [ ] Other: _______

---

## Section D: Code Host & CI/CD

### D1. Code Hosting Platform
**Question:** Which code hosting platform will Stackra use?

**Default Answer:** GitHub (with Platform repo's gate.yml OIDC workflow)

**Recommendation:**
- GitHub chosen because:
  1. `lefthook.yml` mentions `.gitlab-ci.yml` but repo has no GitLab config
  2. Platform repo uses GitHub Actions with OIDC + Infisical
  3. Better MCP integration (GitHub MCP already in `.mcp.json`)
  4. Native Renovate support
  5. Free for public repos, team plan for private

**Required Setup:**
1. `.github/workflows/ci.yml` - Port from Platform's `gate.yml@v2`:
   - OIDC authentication to Infisical
   - Run `pnpm verify` on every PR
   - Remote cache via Turborepo (TURBO_TOKEN from Infisical)
2. `.github/workflows/release.yml` - Changesets-based releases
3. Branch protection rules: `main` requires passing CI + 1 reviewer

**Your Decision:** [ ] GitHub (Recommended) [ ] GitLab [ ] Bitbucket [ ] Other: _______

---

### D2. CI/CD Strategy
**Question:** What CI/CD workflow will you use?

**Default Answer:** GitHub Actions + Turborepo remote cache + OIDC Infisical auth

**Recommendation:**
1. **Workflow structure:**
   ```yaml
   name: CI
   on: [push, pull_request]
   jobs:
     gate:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: oven-sh/setup-bun@v2
         - uses: pnpm/action-setup@v4
         - name: Setup Node + pnpm
           uses: actions/setup-node@v4
           with:
             node-version: ${{ fromJSON(steps.setup-pnpm.outputs.pnpm-version-file-content).engines.node }}
         - name: Install Infisical CLI
           uses: infisical/actions/setup@v1
         - name: Run gate
           run: pnpm verify
           env:
             INFISICAL_TOKEN: ${{ secrets.INFISICAL_SERVICE_TOKEN }}
   ```

2. **OIDC authentication:** Use Infisical service tokens, not long-lived secrets
3. **Remote cache:** Turborepo remote cache signed with HMAC
4. **Security:** Pin actions to SHA (zizmor scanning), cosign SBOM/provenance

**Your Decision:** [ ] GitHub Actions OIDC (Recommended) [ ] GitLab CI [ ] CircleCI [ ] Other: _______

---

### D3. Deployment Strategy
**Question:** How will you deploy apps and services?

**Default Answer:**
- Backend services: Encore Cloud (managed)
- Mobile apps: EAS Build + Submit + Update (managed)
- Web apps: Vercel or Encore static hosting

**Recommendation:**
1. **Encore services:** Deploy via `encore deploy`:
   - `staging`: Auto-deploy from `main` branch
   - `production`: Manual deployment with two-person approval (future)
2. **Mobile apps:** EAS workflow:
   - `preview`: Dev client builds on every PR
   - `staging`: TestFlight/Internal testing on `main`
   - `production`: App Store submission via EAS Submit
3. **Web apps:** Vercel for Next.js, Encore static hosting for console
4. **Infrastructure:** No Terraform until Stackra owns infrastructure (P2)

**Your Decision:**
- Backend: [ ] Encore Cloud (Recommended) [ ] AWS ECS [ ] Kubernetes [ ] Other: _______
- Mobile: [ ] EAS Build/Submit/Update (Recommended) [ ] Bitrise [ ] Fastlane [ ] Other: _______
- Web: [ ] Vercel (Recommended) [ ] Encore static [ ] AWS Amplify [ ] Other: _______

---

## Section E: Monorepo Tooling & Standards

### E1. Package Manager & Workspace Configuration
**Question:** Are you satisfied with current pnpm 12 + Turborepo configuration?

**Default Answer:** Yes, current setup is production-ready

**Current State:**
- `pnpm-workspace.yaml`: Strict catalogs (no literal versions in package.json)
- `turbo.jsonc`: Tier-based boundaries (config→lib→app→service)
- `mise.toml`: Toolchain pins (Node 24, pnpm 12.6.0)
- Quality gates: oxfmt + oxlint + vitest + knip + lefthook

**Recommendation:** Keep as-is, already aligns with enterprise best practices.

**Your Decision:** [ ] Keep current [ ] Migrate to npm/bun [ ] Other adjustments: _______

---

### E2. Code Style & Formatting Enforcement
**Question:** Are you satisfied with current linting/formatting setup?

**Default Answer:** Yes, oxfmt + oxlint is production-ready

**Current State:**
- Formatting: oxfmt (replaces Prettier per ADR-0011)
- Linting: oxlint (replaces ESLint per ADR-0011)
- Git hooks: lefthook (pre-commit format/lint, commit-msg commitlint, pre-push typecheck)

**Recommendation:** Keep oxlint/oxfmt, significantly faster than ESLint/Prettier. Add lint rules from Basalt's `boundaries.jsonc` for package layer enforcement.

**Your Decision:** [ ] Keep oxfmt + oxlint [ ] Add ESLint (NOT RECOMMENDED) [ ] Other: _______

---

### E3. Testing Framework
**Question:** Are you satisfied with current testing setup?

**Default Answer:** Yes, vitest is production-ready

**Current State:**
- Framework: vitest (replaces Jest per ADR-0011)
- Coverage: @vitest/coverage-v8, thresholds in `vitest.shared.ts` (80% lines/functions, 70% branches)
- Placement: Tests beside code (`src/**/__tests__` or `*.test.ts`)
- E2E: Playwright (in apps, not root tests/)

**Recommendation:** Add Playwright for web E2E, Detox for mobile E2E (P1).

**Your Decision:** [ ] Keep vitest [ ] Add Playwright E2E [ ] Add Detox mobile E2E [ ] All of the above

---

### E4. Observability & Error Tracking
**Question:** Which observability platform will you use for error tracking, logging, and metrics?

**Default Answer:** Sentry (per ADR-0020)

**Recommendation:**
1. **Sentry for errors/crashes:**
   - Mobile: `sentry-react-native` (per ADR-0008 from Academorix)
   - Web: `@sentry/react`
   - Backend: `@sentry/node` or Encore's built-in error tracking
2. **No PII in Sentry** - configure before/after send hooks to redact sensitive data
3. **No URL-bearing tracing** - use correlation IDs instead
4. **Logs:** Encore's built-in structured logging + CloudWatch/Azure Monitor

**Your Decision:** [ ] Sentry (Recommended) [ ] Datadog [ ] Bugsnag [ ] LogRocket [ ] None [ ] Other: _______

---

### E5. Dependency Management (Renovate)
**Question:** How will you manage dependency updates?

**Default Answer:** Renovate with Platform repo's shared preset

**Recommendation:**
1. `renovate.json` extends Platform's preset (when available)
2. Schedule: Weekly updates on weekends
3. Group updates: All `@types/*` together, all `react-*` together
4. Automerge: Patch updates for dev dependencies (with green CI)
5. Catalog-only updates: Renovate updates `pnpm-workspace.yaml` catalogs, not individual package.json

**Your Decision:** [ ] Renovate (Recommended) [ ] Dependabot [ ] Manual [ ] Other: _______

---

## Section F: Documentation

### F1. Documentation Strategy
**Question:** Are you satisfied with Mintlify docs setup?

**Default Answer:** Yes, Mintlify is production-ready

**Current State:**
- Platform: Mintlify (apps/docs)
- Structure: `src/` holds all content (docs.json, MDX, ADRs, assets)
- ADRs: `src/adr/` with 21 existing ADRs (0001-0021)
- Navigation: Guides, Architecture, Writing tabs

**Recommendation:** Port P0 docs from docs-port-inventory plan:
- Constitution: 7 pages (laws > ADRs)
- Standards: 9 pages (operating rules)
- Runbooks: 7 pages + 1 deferred
- Guides: 5 pages (3 exist)
- Agents: 7 pages

**Your Decision:** [ ] Keep Mintlify [ ] Migrate to Docusaurus [ ] Other: _______

---

## Section G: Mobile Development

### G1. Expo Configuration
**Question:** Are you satisfied with current Expo SDK 57 setup?

**Default Answer:** Yes, current setup is production-ready

**Current State:**
- SDK: Expo 57 (latest stable)
- Navigation: React Navigation 7 + native stack + Callstack native tabs (iOS 26 Liquid Glass)
- UI: HeroUI Native + Uniwind (Tailwind v4 for React Native)
- Bundles: iOS + Android export working
- TypeScript: Mixed (TS 6 for Expo CLI, TS 7 for other packages)

**Recommendation:** Keep setup, add EAS Update for OTA updates after first production release.

**Your Decision:** [ ] Keep current [ ] Need adjustments: _______

---

### G2. EAS Configuration
**Question:** Have you configured EAS Build, Submit, and Update?

**Default Answer:** Not yet configured (needs setup)

**Required Setup:**
1. `eas.json` with profiles (preview, staging, production)
2. EAS Secrets linked to Infisical
3. App signing: Let EAS manage (default)
4. Credentials: Apple Developer + Google Play Console setup

**Your Decision:** [ ] Configure now (P0) [ ] Defer to after first build [ ] Manual builds only

---

## Section H: Backend Development

### H1. Encore Configuration
**Question:** Are you satisfied with current Encore setup?

**Default Answer:** Yes, services are independent workspace members (ADR-0010)

**Current State:**
- Services: Each is a Turborepo workspace member (`services/*`)
- Structure: `services/<name>/src/main.ts`
- Secrets: `encore.secret()` + Infisical sync
- Tests: `encore test` hooked into `pnpm test`

**Recommendation:** Keep independent services, add more services as needed.

**Your Decision:** [ ] Keep current [ ] Need adjustments: _______

---

### H2. Database Strategy
**Question:** Which database and ORM will you use?

**Default Answer:** PostgreSQL + MikroORM (per ADR-0014)

**Recommendation:**
1. **MikroORM** over Prisma (rejected per ADR-0011)
2. **One database per service** - each service owns its schema and migrations
3. **No shared entities** - services communicate via contracts (ADR-0015)
4. **Connection pooling:** Use Encore's managed connections

**Your Decision:** [ ] PostgreSQL + MikroORM (Recommended) [ ] PostgreSQL + Prisma (NOT ALLOWED) [ ] MySQL [ ] MongoDB [ ] Other: _______

---

## Section I: Security Hardening

### I1. Supply Chain Security
**Question:** How will you harden the supply chain?

**Default Answer:** Multi-layer approach (per ADR-0019)

**Recommendation:**
1. **Dependency pinning:** All versions from catalogs, no ranges
2. **Action pinning:** SHA-pinned GitHub Actions (zizmor scanning)
3. **SBOM/provenance:** cosign attestations on releases
4. **Lockfile:** `pnpm-lock.yaml` committed, `allowBuilds` reviewed
5. **License checks:** No GPL/GPL-3.0 in dependencies (validator enforces)
6. **Known vulnerabilities:** `pnpm audit` in CI

**Your Decision:** [ ] Implement all P1 [ ] Phased approach: _______

---

### I2. Tenant Isolation
**Question:** How will you enforce tenant isolation?

**Default Answer:** Row-Level Security (RLS) + isolation tests (per constitution/tenancy)

**Recommendation:**
1. **RLS:** PostgreSQL Row-Level Security with `ENABLE` + `FORCE` on tenant tables
2. **Scope tree:** `withTenant` + `withScope` context
3. **Isolation tests:** Every service with tenant tables ships `security-tenancy-isolation-test` skill
4. **Audit logging:** All tenant-scoped queries logged
5. **Trigger:** Enforce from first tenant-owned table (P1)

**Your Decision:** [ ] Implement now (P1) [ ] Defer until first tenant table [ ] No multi-tenancy needed

---

## Section J: Agent Configuration

### J1. Agent Source of Truth
**Question:** Where will agents, rules, hooks, and skills live?

**Default Answer:** `.agents/` is source, projected to `.claude/` and `.opencode/` via sync script

**Recommendation:**
1. **Source:** `.agents/` holds canonical content:
   - `agents/` - Repo-specific agents (security-tenancy-reviewer, etc.)
   - `rules/` - Repo-specific rules (versions, workspace-layout, secrets, etc.)
   - `hooks/` - Repo-specific hooks (guard-bash, guard-paths, etc.)
   - `skills/` - Repo-specific skills (stackra-scaffold, etc.)
   - `models.json` - Tier → model mapping
2. **Projection:** `agents-sync.mjs` syncs to `.claude/` and `.opencode/`
3. **Global content:** `sdlc` plugin provides generic agents (code-reviewer, test-engineer, etc.)
4. **Skills:** Generic skills (encore-*, heroui-*, expo-*) stay global, not vendored

**Your Decision:** [ ] Adopt (Recommended) [ ] Copy from Basalt/Figentra (NOT RECOMMENDED) [ ] Manual management

---

### J2. Agent Tier & Model Mapping
**Question:** Are you satisfied with current model mapping?

**Default Answer:** Yes, current `.agents/models.json` is correct

**Current Mapping:**
- `steward`: Haiku (quick, routine tasks)
- `executor`: Sonnet (implementation, coding)
- `reviewer`: Sonnet (code review, standards check)
- `guardian`: Opus (security, architecture, complex planning)
- `lead`: Opus (strategic decisions, breaking ties)

**Recommendation:** Keep mapping, but update `opencode.jsonc` default model (currently `zai.glm-5`, which is retired).

**Your Decision:** [ ] Keep current [ ] Adjust: _______

---

### J3. Agent Hooks Configuration
**Question:** Which hooks should be enabled?

**Default Answer:** Essential hooks only (guard-bash, guard-paths, post-write-checks, session-context)

**Recommendation:**
1. **Keep:**
   - `_io.mjs` - Tool call logging
   - `guard-bash.mjs` - Block dangerous shell commands, enforce Infisical usage
   - `guard-paths.mjs` - Block writes to protected files (`.env`, dist, etc.)
   - `post-write-checks.mjs` - Auto-format after write
   - `session-context.mjs` - Maintain session state (fix ADR path bug)
2. **Drop:**
   - `context-health.mjs` - Never fires (wrong env var)
   - `prompt-hints.mjs` - Figentra-specific

**Your Decision:** [ ] Adopt recommended set [ ] Keep all [ ] Minimal set: _______

---

## Section K: Third-Party Tools & Packages

### K1. Recommended Third-Party Tools

**Question:** Which third-party tools should Stackra adopt?

**Default Recommendations:**

| Category | Tool | Purpose | Priority |
|----------|------|---------|----------|
| **Package Manager** | pnpm 12.6.0 | Fast, strict resolution | ✅ Already have |
| **Build System** | Turborepo 2.11.7 | Monorepo task orchestration | ✅ Already have |
| **Bundler (Web)** | Vite 8.3.2 | Web app bundling | ✅ Already have |
| **Bundler (Lib)** | tsdown 0.23.0 | Library bundling | ✅ Already have |
| **Bundler (Mobile)** | Metro (Expo) | React Native bundling | ✅ Already have |
| **Formatter** | oxfmt 0.71.0 | Code formatting | ✅ Already have |
| **Linter** | oxlint 1.86.0 | Fast linting | ✅ Already have |
| **Testing** | vitest 5.0.3 | Unit testing | ✅ Already have |
| **E2E Testing** | Playwright | Web E2E testing | P1 |
| **Mobile E2E** | Detox | React Native E2E | P2 |
| **Code Quality** | knip 6.39.0 | Unused code detection | ✅ Already have |
| **Git Hooks** | lefthook 2.1.16 | Git hook management | ✅ Already have |
| **Commit Lint** | commitlint 21.2.3 | Conventional commits | ✅ Already have |
| **Versioning** | changesets 3.0.3 | Package versioning | ✅ Already have |
| **Secret Scanner** | gitleaks 8.30.1 | Prevent secret commits | ✅ Already have |
| **Type Checker** | TypeScript 7.0.2 | Type checking | ✅ Already have (TS 6 for Expo) |
| **Mobile Framework** | Expo SDK 57 | React Native development | ✅ Already have |
| **Navigation** | React Navigation 7 | Mobile routing | ✅ Already have |
| **UI Library** | HeroUI React 3.2.6 | Web components | ✅ Already have |
| **UI Library** | HeroUI Native 1.0.10 | Mobile components | ✅ Already have |
| **Styling** | Tailwind CSS 4.3.3 | Web styling | ✅ Already have |
| **Styling (Mobile)** | Uniwind 1.12.1 | React Native styling | ✅ Already have |
| **Backend** | Encore | Backend services | ✅ Already have |
| **Database** | PostgreSQL | Primary database | P1 |
| **ORM** | MikroORM | Object-relational mapping | P1 |
| **Documentation** | Mintlify 4.2.985 | Docs site | ✅ Already have |
| **Observability** | Sentry | Error tracking | P1 |
| **Secrets** | Infisical | Secret management | P1 (setup) |
| **CI/CD** | GitHub Actions | Continuous integration | P1 (setup) |
| **Deployment (Backend)** | Encore Cloud | Service hosting | P1 (setup) |
| **Deployment (Mobile)** | EAS | Mobile build/deploy | P1 (setup) |
| **Deployment (Web)** | Vercel or Encore | Web app hosting | P1 (setup) |
| **Dependency Updates** | Renovate | Automated updates | P1 (setup) |
| **Project Management** | Linear | Issue tracking | P1 (setup) |

**Your Additions:** _______________________________________________

---

### K2. Recommended Packages by Category

**Foundation Layer** (cross-cutting concerns):
- [ ] `@stackra/logger` - Structured logging (P1)
- [ ] `@stackra/config` - Environment/config management (P1)
- [ ] `@stackra/errors` - Error classes and handling (P1)
- [ ] `@stackra/types` - Shared TypeScript types (P1)

**Application Layer** (business logic):
- [ ] Domain packages as needed (P2)

**Communication Layer** (APIs, events):
- [ ] `@stackra/contracts-*` - API contracts (P2, per ADR-0015)

**Infrastructure Layer** (external services):
- [ ] `@stackra/database` - Database connection pool (P1)
- [ ] `@stackra/queue` - Message queue abstraction (P2)
- [ ] `@stackra/cache` - Redis caching (P2)

**Runtime Layer** (execution environment):
- Already covered by Encore, Expo, Vite

**Data Layer** (data structures):
- [ ] `@stackra/schemas` - Zod validation schemas (P1)

**Developer Experience** (tooling):
- ✅ Already have presets (typescript-config, oxlint-config, vitest-config, tsdown-config)

**Experience Layer** (UI components):
- ✅ HeroUI React + Native cover most needs
- [ ] `@stackra/ui-theme` - Brand-specific theming (P2)

**Security Layer** (auth, permissions):
- [ ] `@stackra/auth` - Authentication helpers (P1, per constitution/security)
- [ ] `@stackra/permissions` - Authorization/rbac (P2)

**State Management** (client state):
- [ ] `@stackra/state` - State management utilities (P2)

**Your Additions:** _______________________________________________

---

### K3. Default Package Structure Template

**Question:** Should we enforce a standard package structure?

**Default Answer:** Yes, use scaffold templates for all new packages/services/apps

**Recommended Files per Member Type:**

**Tier: App (apps/*)**
```
apps/<name>/
├── src/
│   └── main.ts (entry point)
├── package.json (scripts, catalog deps)
├── tsconfig.json (extends @stackra/typescript-config/<preset>)
├── turbo.json (tier tag)
├── README.md (purpose, PII table)
├── AGENTS.md (member-specific rules)
├── CHANGELOG.md (changesets managed)
└── LICENSE (UNLICENSED for private)
```

**Tier: Service (services/*)**
```
services/<name>/
├── src/
│   ├── main.ts (Encore entry)
│   └── __tests__/ (beside code)
├── package.json
├── tsconfig.json
├── turbo.json
├── README.md
├── AGENTS.md
├── CHANGELOG.md
└── LICENSE
```

**Tier: Lib (packages/<category>/<name>)**
```
packages/<category>/<name>/
├── src/
│   ├── index.ts (barrel)
│   ├── <module>.ts (implementation)
│   └── __tests__/
├── package.json
├── tsconfig.json
├── turbo.json
├── README.md
├── AGENTS.md
├── CHANGELOG.md
└── LICENSE
```

**Tier: Config (packages/tooling/<name>)**
```
packages/tooling/<name>/
├── src/
│   ├── index.ts (preset export)
│   └── __tests__/
├── package.json
├── README.md
├── AGENTS.md
├── CHANGELOG.md
└── LICENSE
```

**Your Decision:** [ ] Adopt standard (Recommended) [ ] Custom structure: _______

---

## Section L: Phased Implementation Roadmap

### Phase 1: Foundation (P0 - Before First Package/Service)
**Timeline:** 1-2 days

**Tasks:**
1. ✅ Monorepo structure established
2. ✅ Tooling presets configured
3. [ ] Set up Infisical workspace and folder structure (`/agents`, `/ci`)
4. [ ] Configure `.infisical.json` and test Infisical CLI
5. [ ] Update root `package.json` scripts to use `infisical run`
6. [ ] Set up Linear workspace (if using)
7. [ ] Configure `.github/workflows/ci.yml` with OIDC
8. [ ] Set up branch protection rules
9. [ ] Port P0 docs from docs-port-inventory:
   - [ ] Constitution: index, boundaries, secrets, http-and-events
   - [ ] ADRs: 0003-0012 (tier direction through code host)
   - [ ] Standards: members, packages, services, code-style, testing, dependencies
   - [ ] Guides: definition-of-done, scaffolding
   - [ ] Runbooks: secrets, ci
   - [ ] Agents: concurrent-sessions, rules folder
10. [ ] Update ADR citations across repo (1 sweep)
11. [ ] Set up agent sync system (agents-sync.mjs + hooks + rules)
12. [ ] Configure Sentry project (if using)

**Parallelizable:** Yes, multiple Sonnet subagents can handle docs sections

---

### Phase 2: Core Packages (P1 - Essential Infrastructure)
**Timeline:** 1-2 weeks

**Tasks:**
1. [ ] Create foundation packages: logger, config, errors, types
2. [ ] Set up PostgreSQL database per service
3. [ ] Configure MikroORM for each service
4. [ ] Create security packages: auth, permissions
5. [ ] Set up EAS project (eas.json + secrets)
6. [ ] First Encore service deployment (staging)
7. [ ] First mobile app build (development client)
8. [ ] Port P1 docs:
   - [ ] Constitution: security, tenancy, delegation
   - [ ] ADRs: 0013-0017 (versioning through agent roster)
   - [ ] Standards: i18n-rtl, ui-and-accessibility
   - [ ] Runbooks: release, mobile-release, renovate, deploys, upgrade
   - [ ] Agents: roster, hooks, skills, spec-lifecycle, rules-that-dont-rot
9. [ ] Add P1 agents: service/frontend/mobile builders, design-brand-reviewer
10. [ ] Set up Renovate configuration
11. [ ] Implement tenant isolation tests

**Parallelizable:** Yes, foundation packages can be scaffolded in parallel

---

### Phase 3: Production Readiness (P1.5 - Before Launch)
**Timeline:** 2-4 weeks

**Tasks:**
1. [ ] Production deployment pipeline (Encore staging → prod)
2. [ ] App Store submission workflow (EAS Submit)
3. [ ] Production testing (E2E tests, performance benchmarks)
4. [ ] Security audit (supply chain, RLS, secrets rotation)
5. [ ] Documentation completion (all P0/P1)
6. [ ] Observability setup (Sentry dashboards, alerts)
7. [ ] Incident response runbook
8. [ ] Disaster recovery plan

**Parallelizable:** Mixed (some require previous phases)

---

### Phase 4: Enhancement (P2 - Future)
**Timeline:** Ongoing

**Tasks:**
1. [ ] Port P2 ADRs: framework-design-record, supply-chain-hardening, observability, ai-engine
2. [ ] Add P2 agents: i18n-steward
3. [ ] Infrastructure as Code (Terraform) when Stackra owns infrastructure
4. [ ] Operations runbooks (SLOs, DR, access reviews)
5. [ ] Mobile E2E tests (Detox)
6. [ ] Advanced observability (tracing, APM)

**Parallelizable:** Yes, can be done as needed

---

## Section M: Open Decisions Requiring Your Input

These decisions cannot have default recommendations because they depend on your specific context:

### M1. Product vs Platform Strategy
**Question:** Is Stackra a single product, a platform hosting multiple products, or a mix?

**Impact:** Determines if you need product-specific service nesting (`services/<product>/<svc>`) vs flat services

**Your Decision:** [ ] Single product (flat services) [ ] Multiple products (nested services) [ ] Platform (future decision)

---

### M2. Team Expansion Timeline
**Question:** When do you expect to add team members?

**Impact:** Two-person approval gates, CODEOWNERS, and collaboration features

**Your Decision:** [ ] Solo indefinitely [ ] 1-3 months [ ] 3-6 months [ ] 6+ months

---

### M3. Payment Provider
**Question:** Will Stackra handle payments? Which provider?

**Impact:** Stripe MCP already configured, but determines if billing domain package is needed

**Your Decision:** [ ] Stripe (MCP ready) [ ] No payments [ ] Other: _______

---

### M4. Internationalization Strategy
**Question:** Do you need multi-language support from day one?

**Impact:** i18n packages, RTL support, translation workflow

**Your Decision:** [ ] English only (MVP) [ ] Multi-language from start [ ] Add later (P2)

---

### M5. Mobile Release Strategy
**Question:** What's your target mobile release cadence?

**Impact:** EAS Update frequency, app store review strategy, OTA update scope

**Your Decision:** [ ] Continuous (every feature) [ ] Weekly [ ] Bi-weekly [ ] Monthly [ ] Major versions only

---

### M6. Data Residency Requirements
**Question:** Do you have specific data residency requirements (EU, US, etc.)?

**Impact:** Database hosting regions, CDN config, GDPR compliance

**Your Decision:** [ ] No specific requirements [ ] EU-only [ ] US-only [ ] Multi-region: _______

---

### M7. Open Source Strategy
**Question:** Will you open source any Stackra packages?

**Impact:** LICENSE choice, package publishing workflow, documentation requirements

**Your Decision:** [ ] All private (UNLICENSED) [ ] Some packages open source [ ] All open source [ ] Undecided

---

### M8. Brand Identity
**Question:** Do you have brand guidelines (colors, typography, logo)?

**Impact:** HeroUI/Uniwind theming, docs branding, design-brand-reviewer agent

**Your Decision:** [ ] No brand yet (use defaults) [ ] Have brand guidelines [ ] Need brand creation

---

## Section N: Next Steps After Questionnaire Completion

Once you've reviewed and made decisions:

1. **Save decisions:** Record your choices in `.agents/plans/decisions.md`
2. **Prioritize:**
   - P0 items: Block all development until complete
   - P1 items: Can develop in parallel with feature work
   - P2 items: Defer until after MVP
3. **Execute Phase 1:**
   - Use subagents for parallel tasks (docs port, agent setup)
   - Keep this session for coordination and decisions
4. **Validate:**
   - Run `pnpm verify` after each phase
   - Check agent sync with `pnpm agents:check`
   - Verify Infisical auth with `infisical run -- echo "OK"`

---

## Appendix: Quick Reference

### A. Environment Variable Conventions
- App secrets: `encore.secret()` or Infisical `/apps/<name>/<env>`
- Service secrets: Infisical `/services/backend/<env>`
- CI secrets: Infisical `/ci`
- Agent secrets: Infisical `/agents`

### B. Catalog Structure (pnpm-workspace.yaml)
- `catalog` (default): Shared across all members
- `catalogs.build`: TypeScript, tsdown, Turbo
- `catalogs.quality`: oxfmt, oxlint, vitest, knip
- `catalogs.release`: changesets, commitlint, lefthook
- `catalogs.frontend`: React, Vite, Tailwind, HeroUI
- `catalogs.mobile`: Expo, React Navigation, HeroUI Native, Uniwind
- `catalogs.docs`: Mintlify
- `catalogs.next`: Next.js apps

### C. Tier Tags (turbo.json boundaries)
- `tier:config`: Tooling presets (no workspace dependencies)
- `tier:lib`: Packages (never depend on apps/services)
- `tier:app`: Apps (never depend on services)
- `tier:service`: Services (top of graph)

### D. Agent Tiers (.agents/models.json)
- `steward`: Haiku - Quick checks, routine tasks
- `executor`: Sonnet - Implementation, coding
- `reviewer`: Sonnet - Code review, standards
- `guardian`: Opus - Security, architecture
- `lead`: Opus - Strategic decisions

### E. ADR Status Vocabulary
- `proposed`: Under discussion
- `accepted`: Ratified, in effect
- `deprecated`: Still in effect, but scheduled for replacement
- `superseded: NNNN` - Replaced by ADR-NNNN
- `rejected`: Not adopted, documented for posterity

### F. Required Files per Member
See `packages/tooling/vitest/validate-repository.mjs` and docs-port-inventory section 3.

---

**Generated:** 2026-10-19
**Purpose:** Comprehensive setup guide for Stackra monorepo configuration
**Next:** Review decisions, start Phase 1 execution
