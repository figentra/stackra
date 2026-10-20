# stackra

pnpm 12 + Turborepo monorepo. Global rules in `~/.claude/rules/` apply (module boundary, tenancy, secrets,
HTTP conventions, not-built-yet). Full guides: `apps/docs` (`pnpm docs`). Every member keeps its code in `src/`.

| Path                                                       | Holds                                                                                                                                                     | Tier tag       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `apps/console`                                             | `@figentra/console` — hello-world entry `src/main.ts`                                                                                                     | `tier:app`     |
| `apps/mobile`                                              | `@figentra/mobile` — hello-world entry `src/main.ts`                                                                                                      | `tier:app`     |
| `apps/docs`                                                | `@figentra/docs` — Mintlify; `docs.json`, pages and `assets/` all in `src/`; ADRs in `src/adr`; `pnpm docs`                                               | `tier:app`     |
| `packages/<category>/<name>`                               | `@stackra/<name>`, flat inside one category: foundation, application, communication, cross-cutting, data, developer, experience, runtime, security, state | `tier:lib`     |
| `packages/tooling/*`                                       | `@stackra/{typescript,oxlint,vitest,tsdown}-config` presets                                                                                               | `tier:config`  |
| `services/<name>`                                          | `@figentra/service-<name>` — one member per service (`example`, `health`), entry `src/main.ts`                                                            | `tier:service` |
| `tools/scripts`                                            | `validate-repository.mjs` (+ test); `scaffold.mjs` (+ test) — `pnpm new <kind> <name>`, templates in `tools/scaffold`                                     | —              |
| `.agents/hooks`, `.claude/settings.json`, `opencode.jsonc` | agent hooks and config                                                                                                                                    | —              |

Rules every member follows (`pnpm validate` enforces them):

- Versions come only from `pnpm-workspace.yaml` catalogs (`catalog:<name>`) or `workspace:*`. `catalogMode: strict`.
- `turbo.jsonc` extends `//` with exactly one tier tag; `tsconfig.json` extends one `@stackra/typescript-config` preset.
- Every test file sits directly in a `__tests__/` folder beside its subject (`src/**/__tests__/<name>.test.ts`), anywhere in the repo; no root `tests/`, no `.spec`. App e2e lives in the app. ADR 0022, enforced by `pnpm validate`.
- A package never imports an app, a service or `encore.dev`, nor another package's `src/`.
- A JSON config is `.jsonc` (comments welcome) when its tool reads JSONC; tsconfig files keep `.json` and take comments.
  The files that must stay strict `.json`, with the reason, are `MUST_STAY_JSON` in `tools/scripts/validate-repository.mjs`.

Done = `pnpm verify` green (format, lint, typecheck, test, build, validate, boundaries, knip). Conventional commits.

<!-- BEGIN generated from .agents/rules by tools/scripts/agents-sync.mjs — edit the sources, not this block -->

## Repository rules

Always-on rules follow in full. Read a file-scoped rule before touching a file its
globs match.

<!-- source: .agents/rules/concurrent-sessions.md -->

### Concurrent Sessions

Multiple AI agents can work on Stackra simultaneously with worktrees.

#### Preconditions

Before starting concurrent work:

1. **Clean working tree** - Commit or stash all changes
2. **Green CI** - All checks passing on main
3. **Sync dependencies** - `pnpm install`
4. **Understand conflicts** - Agents touching the same files will conflict

#### Worktree Strategy

Create a worktree per agent:

```bash
# Main worktree: /Users/akouta/Projects/final-project
git worktree add ../stackra-auth feature/auth

# Agent 1: Authentication in worktree
cd ../stackra-auth
pnpm install
# Agent works here

# Agent 2: UI components in main worktree
cd /Users/akouta/Projects/final-project
# Agent works here

# Merge when done
git worktree remove ../stackra-auth
```

#### Coordination Rules

##### File Ownership

Each agent claims a file boundary:

- Agent A: `packages/foundation/*`
- Agent B: `packages/security/*`
- Agent C: `services/auth/*`

Never cross boundaries without explicit handoff.

##### Shared Files

Some files are shared (read-only for all but one agent):

- `pnpm-workspace.yaml` - Only dependency-steward
- `turbo.jsonc` - Only architecture-guardian
- `.agents/rules/*` - Only one agent at a time

##### Communication

Agents must:

1. **Announce intent** - "I'm modifying `packages/foundation/logger`"
2. **Claim files** - Create `.agents/locks/<agent-id>` with file list
3. **Release files** - Delete lock file when done

#### Phased Work

Large refactors run in phases:

1. **Phase 1** - Foundation (Agent A)
2. **Phase 2** - Depends on Phase 1 (Agent B)
3. **Phase 3** - Depends on Phase 2 (Agent C)

Never start Phase N+1 until Phase N is merged to main.

#### Merge Conflicts

If two agents conflict:

1. **Don't force merge** - Creates tech debt
2. **Coordinate** - One agent rebases, the other waits
3. **Gate check** - `pnpm verify` must pass after merge

#### Enforcement

- `guard-paths.mjs` blocks modifications to locked files
- Session context tracks agent boundaries
- Merge checks enforce coordination

#### Best Practices

- Prefer small, focused tasks over large refactors
- Test in isolation before merging
- Document the change in the PR description
- Run full gate after merge

#### See Also

- Constitution: delegation
- Agents: concurrent-sessions (docs page)

<!-- source: .agents/rules/http-conventions.md -->

### HTTP Conventions

Stackra backend APIs follow Encore conventions with additional rules.

#### Endpoints

Every Encore endpoint uses `api()` from `encore.dev/api`:

```typescript
import { api } from "encore.dev/api";

export const getUser = api(
  { method: "GET", path: "/users/:id" },
  async ({ id }: { id: string }): Promise<User> => {
    // ...
  },
);
```

#### Methods

HTTP methods **by idempotency**:

- `GET` - Safe, idempotent, no body
- `PUT` - Idempotent, replaces entire resource
- `DELETE` - Idempotent
- `POST` - Non-idempotent, creates resources
- `PATCH` - Non-idempotent, partial update

#### Authentication

All endpoints authenticated by default:

```typescript
export const getUser = api(
  {
    method: "GET",
    path: "/users/:id",
    auth: true, // Default, can omit
  },
  async ({ id }, { auth }: { id: string }, authData) => {
    const userId = authData.userID;
    // ...
  },
);
```

Public endpoints must explicitly opt-out:

```typescript
export const health = api(
  { method: "GET", path: "/health", auth: false },
  async (): Promise<{ status: "ok" }> => ({ status: "ok" }),
);
```

#### Request/Response

##### Always typed

```typescript
interface GetUserRequest {
  id: string;
}

interface User {
  id: string;
  email: string;
  createdAt: string; // ISO 8601
}

export const getUser = api(
  { method: "GET", path: "/users/:id" },
  async (req: GetUserRequest): Promise<User> => {
    /* ... */
  },
);
```

##### Cursor pagination

```typescript
interface ListUsersRequest {
  cursor?: string;
  limit?: number; // Default: 20, max: 100
}

interface ListUsersResponse {
  users: User[];
  nextCursor?: string;
  hasMore: boolean;
}
```

##### Prefixed IDs

```typescript
// Use prefixed IDs externally
interface User {
  id: string; // "user_01H2J3K4L5M6N7P8Q9R0"
  email: string;
}

// Internal: never expose database IDs
```

#### Idempotency

Non-GET operations support `Idempotency-Key`:

```typescript
export const createPayment = api(
  { method: "POST", path: "/payments" },
  async (req: CreatePaymentRequest, headers: { "idempotency-key"?: string }) => {
    const key = headers["idempotency-key"];
    // Use key for deduplication
  },
);
```

#### Versioning

**Versioned events, not endpoints.**

- Endpoints are immutable (no `/v1`, `/v2`)
- Events are versioned (`user.created.v1`, `user.created.v2`)
- New endpoint → new path
- API versions are dates: the `Stackra-Version` header, pinned per API key or OAuth app, through the dormant `@stackra/versioning` package. Paths stay unversioned (`/adr/0118-api-versioning-dormant-package`)

#### Error Handling

Use Encore's APIError:

```typescript
import { APIError } from "encore.dev/api";

if (!user) {
  throw APIError.notFound("user not found");
}

if (!authorized) {
  throw APIError.permissionDenied("cannot access this user");
}
```

#### See Also

- Constitution: http-and-events
- ADR-0010: Services are independent members
- Standards: api-contracts

<!-- source: .agents/rules/linear.md -->

### Linear

Team `STA` tracks all work (ADR 0065, ADR 0121 D14). **Work is not done until its Linear issue is in the right
state.** Every agent, including subagents and OpenCode executors without the Linear MCP, uses `pnpm linear`:

| When                       | Run                                                              |
| -------------------------- | ---------------------------------------------------------------- |
| Starting work              | `pnpm linear start STA-n` (In Progress, comment with the branch) |
| Opening the PR             | `pnpm linear review STA-n <pr-url>` (In Review, PR attached)     |
| Merged / finished          | `pnpm linear done STA-n <link>`                                  |
| Progress, findings, blocks | `pnpm linear comment STA-n "<text>"`                             |
| New work found             | `pnpm linear create --title "…" [--project p] [--labels a,b]`    |
| What is open               | `pnpm linear mine`, `pnpm linear open [--label owner]`           |

- Branch names are Linear's (`figentra/sta-<n>-<slug>`; `pnpm delegate` uses `delegate/sta-<n>-…`), checked by
  `check-pr`. A `feat`/`fix`/`refactor`/`perf` commit carries
  `Refs: STA-n`. The PR title or branch names the key, or the PR is labelled `chore-lane`.
- `pnpm delegate` needs `--issue STA-n`. Issues an agent creates get the `agent` label automatically.
- Actions run as the "Stackra Agent" app, which is the issue's delegate. The human assignee is never changed.
- Tokens come from Infisical only (`pnpm linear` wraps `infisical run --env=dev --path=/agents`). Never print one.
- A Linear failure never blocks a gate (ADR 0065 rule 7). The nightly `Linear sync` workflow repairs drift.

#### Enforcement

`commitlint.config.mjs` (`refs-linear-key`, lefthook and the Quality Gate over the PR range); `linear.mjs check-pr`
in the Quality Gate; `requireIssue` in `tools/scripts/delegate.mjs`; `.github/workflows/linear-sync.yml`
(`tools/scripts/linear-reconcile.mjs`) moves states, closes decided ADR issues and labels stale work.

<!-- source: .agents/rules/module-boundary.md -->

### Module Boundary

Packages and services are isolated by tier. The dependency graph flows one way: config → lib → app → service.

#### Direction

```
config → lib → app → service
  ↓        ↓       ↓        ↓
  ←────────←───────←───────← (never upstream)
```

#### Rules

1. **No upstream imports** - A tier never imports from tiers above it
2. **No cross-app imports** - Apps don't import from other apps
3. **No cross-service imports** - Services don't import from other services (use Pub/Sub)
4. **Packages import from own layer or below** - Never from apps/services

#### Forbidden Patterns

```typescript
// ❌ App importing from service
import { user } from "@figentra/service-auth";

// ❌ Package importing from app
import { Login } from "@figentra/console";

// ❌ Service importing from another service
import { stripe } from "@figentra/service-payments";

// ❌ Cross-app import
import { Header } from "@figentra/console/src/header";
```

#### Allowed Patterns

```typescript
// ✅ App importing from package
import { Button } from "@stackra/experience/button";

// ✅ Service importing from package
import { logger } from "@stackra/foundation/logger";

// ✅ Package importing from lower package
import { config } from "@stackra/foundation/config";

// ✅ Config presets have no imports
import { defineConfig } from "tsdown";
```

#### Encore Services

Encore services communicate via:

- **RPC calls** - Encore's typed client
- **Pub/Sub** - Asynchronous messaging
- Never direct imports

#### Enforcement

- `turbo boundaries` enforces tier direction
- `packages/tooling/oxlint/boundaries.jsonc` blocks forbidden imports
- `tools/scripts/validate-repository.mjs` checks tier tags

#### See Also

- ADR-0003: Tier dependency direction
- ADR-0004: Package archetypes and layers
- Constitution: boundaries (placement test)

<!-- source: .agents/rules/not-built-yet.md -->

### Not built yet

If a task seems to need one of these, stop and route to the `architecture-guardian` agent. Rejected means no; deferred
means not yet. A row changes only by a new ADR. Full table with revival triggers: `/adr/0011-rejected-and-deferred-technologies`.

| Do not introduce                                                                                                                                | Status   | Use instead                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hand-written Encore (`encore.dev`, `~encore/*`, `encore.*` files) in service members; Encore is only the generated target in `.stackra/encore/` | Deferred | plain TypeScript service members, Encore generated by `stackra gen` (`/adr/0091-generated-encore-app-in-stackra-folder`)                                                                                   |
| `@nestjs/*`; an API gateway in front of services                                                                                                | Rejected | `@stackra/container` (Nest-shaped, no `@nestjs/*`)                                                                                                                                                         |
| `reflect-metadata`, type-based auto-wiring                                                                                                      | Rejected | explicit tokens (`/adr/0005-di-container-and-legacy-decorators`)                                                                                                                                           |
| Prisma, Drizzle, TypeORM, Knex                                                                                                                  | Rejected | MikroORM (`/adr/0014-data-ownership-and-orm`)                                                                                                                                                              |
| ESLint, Prettier, Jest                                                                                                                          | Rejected | oxlint, oxfmt, vitest                                                                                                                                                                                      |
| Express, Fastify as a server framework                                                                                                          | Rejected | the runtime chosen by ADR                                                                                                                                                                                  |
| Vite+ (`vp`) as task runner                                                                                                                     | Rejected | Turborepo, oxlint, oxfmt, lefthook                                                                                                                                                                         |
| A second vault, Doppler, secret values in files, `.env`                                                                                         | Rejected | Infisical + runtime secret store                                                                                                                                                                           |
| A second code host in this repo (code host is GitHub)                                                                                           | Rejected | one host (`/adr/0012-code-host-and-ci`)                                                                                                                                                                    |
| expo-router in the mobile app                                                                                                                   | Rejected | code-based React Navigation (`@react-navigation/*`, `react-native-bottom-tabs`)                                                                                                                            |
| Zustand, TanStack Store for client state                                                                                                        | Rejected | `@stackra/state` (`/adr/0079-client-state-is-stackra-state`, owner decision F10a)                                                                                                                          |
| i18next, react-i18next                                                                                                                          | Rejected | `@stackra/i18n` (`/adr/0080-i18n-is-the-figentra-i18n-port`, owner decision F12)                                                                                                                           |
| class-validator, class-transformer                                                                                                              | Rejected | `@stackra/validation` on Zod (`/adr/0095-zod-inside-field-decorators`)                                                                                                                                     |
| An AI gateway; a separate-language agent runtime                                                                                                | Rejected | AI SDK core + MCP SDK inside the service                                                                                                                                                                   |
| A runtime schema engine, JSONB-for-everything, tenant data that carries code, markup or logic                                                   | Rejected | coded resources, build-time generation; allowed: data that only references registered code (L2 UI documents, builder agents, automations, custom fields; `/adr/0110-experience-is-the-sdui-service-at-l2`) |
| A shared React component library across web and native                                                                                          | Deferred | share types, client, validation, state, i18n, tokens                                                                                                                                                       |
| A sync engine (RxDB, ElectricSQL, PowerSync, WatermelonDB)                                                                                      | Deferred | mutation queue with idempotency keys                                                                                                                                                                       |
| Typesense, Meilisearch, OpenSearch                                                                                                              | Deferred | Postgres `pg_trgm` + full-text behind a search interface                                                                                                                                                   |
| OpenFGA, SpiceDB, Cedar                                                                                                                         | Deferred | in-house `check(subject, relation, object)`                                                                                                                                                                |
| A separate observability service; Prometheus for business metrics                                                                               | Deferred | platform tracing, metrics, logs                                                                                                                                                                            |

Enforcement: `FORBIDDEN_DEPENDENCIES` in `tools/scripts/validate-repository.mjs` (eslint, prettier, jest, nest,
reflect-metadata, prisma, drizzle, express, fastify, typeorm, knex, expo-router, zustand, @tanstack/store, i18next,
react-i18next, class-validator, class-transformer, meilisearch, @opensearch-project/opensearch); `boundaries.jsonc` bans `encore.dev` in packages.
Rows naming no package are planned (guardian review). Docs: `/adr/0011-rejected-and-deferred-technologies`.

<!-- source: .agents/rules/secrets.md -->

### Secrets

Stackra uses **two secret mechanisms** (ADR-0009):

#### 1. App Secrets (Encore, generated app)

Services are plain TypeScript and hold no Encore files. The Encore application is generated into the
gitignored `.stackra/encore` (ADR 0091), and app secrets reach it through Encore `secret()` there:

```typescript
import { secret } from "encore.dev/config";

const stripeSecretKey = secret("StripeSecretKey");
```

- Stored in Encore's secret manager, synced from Infisical
- A human sets each value per environment; an agent only names the secret
- Never in git

#### 2. Dev/CI Secrets (Infisical)

All other secrets through Infisical:

##### Vault Layout

- dev: `/agents` - Developer and agent tokens (local dev, MCP servers)
- staging|prod: `/ci` - CI/CD deployment secrets

##### How to Use

**Local development:**

```bash
infisical run -- pnpm dev
infisical run -- encore run
```

**CI/CD:**

```bash
infisical run --env=staging -- pnpm build
infisical run --env=production -- encore deploy
```

**MCP servers:**
Token-based MCP servers launch through the `tools/scripts/mcp.sh` vault wrapper (reads from `/agents`). This is a
convention; no hook enforces it.

##### Required Secrets

In Infisical `/agents` (local):

- `HEROUI_PERSONAL_TOKEN` - HeroUI Pro license
- `GITHUB_PERSONAL_ACCESS_TOKEN` - GitHub MCP
- `STRIPE_SECRET_KEY` - Stripe MCP (optional)
- `CONTEXT7_API_KEY` - Context7 MCP
- `RESEND_API_KEY` - Resend MCP (optional)

In Infisical `/ci` (CI/CD):

- `TURBO_TOKEN` - Turborepo remote cache
- `ENCORE_API_KEY` - Encore deployment
- `SENTRY_AUTH_TOKEN` - Sentry releases (optional)

#### Forbidden Patterns

1. **No `.env` files** - Use Infisical injection
2. **No hardcoded secrets** - Not in code, not in git
3. **No secret values in configs** - Only secret references

##### Blocked by Hooks

- `guard-bash.mjs`: Blocks `infisical export`, `infisical secrets get` without `--silent`, a bare `infisical secrets`
  (lists values) and `infisical run -- env|printenv`
- `guard-paths.mjs`: Blocks writes to `.env`, `.env.*`, `.dev.vars`, `.ci-env` and `.sentryclirc`
- `.gitleaks.toml`: Scans for accidental secret commits

#### Enforcement

Each article below is bound to a check:

1. **Secrets never in git** → `gitleaks` pre-commit + CI scan
2. **No .env files** → `guard-paths` hook
3. **CI secrets from OIDC** → GitHub Actions OIDC (Phase 2)
4. **App secrets synced** → Encore deployment of the generated `.stackra` app (Phase 2)

#### Setup

1. Install Infisical CLI: `brew install infisical`
2. Create workspace: `infisical init`
3. Configure `.infisical.json` (workspace ID from Infisical UI)
4. Add secrets to `/agents` folder
5. Run commands with `infisical run -- <command>`

#### See Also

- Constitution: secrets (laws)
- ADR-0009: Two secret mechanisms
- Runbook: secrets (vault layout, rotation)

<!-- source: .agents/rules/versions.md -->

### Versions

Stackra versions come from **one of two sources**, never a third:

1. **Catalogs** in `pnpm-workspace.yaml`: the single source of truth for every package version
   - Default catalog (`catalog:`): shared dependencies
   - Named catalogs (`catalog:build`, `catalog:quality`, etc.): domain-specific versions
2. **Workspace references** (`workspace:*`): intra-repo packages

#### Rules

1. **No literal versions in package.json** - always use `catalog:` or `workspace:*`
2. **No ranges in catalogs** - pin to exact versions (`1.2.3` not `^1.2.3`)
3. **No `latest` or `*`** - every version is explicit
4. **Catalog changes reviewed by dependency-steward** - version bumps affect the entire repo
5. **Toolchain versions in `mise.toml`** - Node, pnpm, gitleaks pinned exactly

#### Enforcement

- `tools/scripts/validate-repository.mjs` checks catalog references
- `pnpm install` fails on invalid catalog: entries (`catalogMode: strict`)
- Turborepo's `globalDependencies` includes `mise.toml` and `pnpm-workspace.yaml`

#### Why

One bump in `pnpm-workspace.yaml` propagates to every member. Version drift is impossible because the validator blocks it.

#### See Also

- Constitution: boundaries (package placement)
- Standards: dependencies (catalog usage guide)
- ADR-0003: tier dependency direction (dependency rules)

<!-- source: .agents/rules/workspace-layout.md -->

### Workspace Layout

Stackra follows a strict tiered structure enforced by Tiers and boundaries.

#### Structure

```
stackra/
├── apps/                    # tier:app
│   ├── console/            # Vite web app (minimal entry)
│   ├── docs/               # Mintlify documentation
│   └── mobile/             # Expo SDK 57 app
├── packages/               # tier:lib
│   ├── application/        # Business logic
│   ├── communication/      # APIs, events, contracts
│   ├── cross-cutting/      # Logging, config, errors
│   ├── data/               # Schemas, validation
│   ├── developer/          # Dev tooling (internal)
│   ├── experience/         # UI components (shared)
│   ├── foundation/         # Core utilities
│   ├── infrastructure/     # DB, cache, queue
│   ├── runtime/            # Execution environment
│   ├── security/           # Auth, permissions
│   └── state/              # Client state management
├── services/               # tier:service
│   ├── example/            # Encore hello-world service
│   └── health/             # Health check service
└── tools/
    ├── scripts/            # validation, scaffolding
    └── scaffold/           # Templates
```

#### Tier Tags

Every member declares exactly one tier in its `turbo.jsonc`:

- `tier:config` - Tooling presets (no workspace dependencies)
- `tier:lib` - Packages (category-based, never depend on apps/services)
- `tier:app` - Apps (never depend on services)
- `tier:service` - Encore services (top of graph)

#### Placement Test

1. **Is it deployed?** → `tier:service` or `tier:app`
2. **Is it consumed by multiple apps/services?** → `tier:lib` in appropriate category
3. **Is it build/lint/test configuration?** → `tier:config` in `packages/tooling/`
4. **Is it a script?** → `tools/scripts/`
5. **Is it a template?** → `tools/scaffold/`

#### What Goes Where

##### Packages (<category>/<name>)

- Shared code consumed by apps/services
- Organized by layer: foundation, application, communication, etc.
- Entry point: `src/index.ts`
- Tests: `src/**/__tests__/` only (ADR 0022)

##### Services (<name>)

- Backend services ( Encore )
- Independent workspace members
- Entry: `src/main.ts`
- Tests: `src/__tests__/`

##### Apps (<name>)

- Console: Minimal Vite app
- Docs: Mintlify documentation site
- Mobile: Expo React Native app
- Entry: `src/main.ts`

#### Forbidden Paths

- No root `tests/` - tests live beside code
- No `src/` in workspace root
- No packages directly in `packages/` - must have category folder
- No `packages/tooling/<name>/src/lib/` - single layer

#### Enforcement

- `turbo boundaries` checks dependency direction
- `tools/scripts/validate-repository.mjs` checks tier tags, file existence, and that every JSON config whose tool reads JSONC is named `.jsonc` (exceptions: `MUST_STAY_JSON`)
- `packages/tooling/oxlint/boundaries.jsonc` enforces layer rules

#### See Also

- ADR-0004: Package archetypes and layers
- ADR-0003: Tier dependency direction
- Standards: members (required files per tier)

### Read before touching matching files

- **Service checklist** — `services/**`: read `.agents/rules/service-checklist.md`
- **Task vocabulary** — `**/package.json`, `turbo.jsonc`: read `.agents/rules/task-vocabulary.md`

### On request

- Tenancy — Two-layer tenant isolation and scope-tree rules. Read when adding the first tenant-owned table or touching tenant-scoped code; not loaded by default. (`.agents/rules/tenancy.md`)

<!-- END generated from .agents/rules -->
