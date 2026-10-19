# stackra

pnpm 12 + Turborepo monorepo. Global rules in `~/.claude/rules/` apply (module boundary, tenancy, secrets,
HTTP conventions, not-built-yet). Full guides: `apps/docs` (`pnpm docs`). Every member keeps its code in `src/`.

| Path                                                       | Holds                                                                                                                                                     | Tier tag       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `apps/console`                                             | `@stackra/console` — hello-world entry `src/main.ts`                                                                                                      | `tier:app`     |
| `apps/mobile`                                              | `@stackra/mobile` — hello-world entry `src/main.ts`                                                                                                       | `tier:app`     |
| `apps/docs`                                                | `@stackra/docs` — Mintlify; `docs.json`, pages and `assets/` all in `src/`; ADRs in `src/adr`; `pnpm docs`                                                | `tier:app`     |
| `packages/<category>/<name>`                               | `@stackra/<name>`, flat inside one category: foundation, application, communication, cross-cutting, data, developer, experience, runtime, security, state | `tier:lib`     |
| `packages/tooling/*`                                       | `@stackra/{typescript,oxlint,vitest,tsdown}-config` presets                                                                                               | `tier:config`  |
| `services/<name>`                                          | `@stackra/service-<name>` — one member per service (`example`, `health`), entry `src/main.ts`                                                             | `tier:service` |
| `tools/scripts`                                            | `validate-repository.mjs` (+ test); `scaffold.mjs` (+ test) — `pnpm new <kind> <name>`, templates in `tools/scaffold`                                     | —              |
| `.agents/hooks`, `.claude/settings.json`, `opencode.jsonc` | agent hooks and config                                                                                                                                    | —              |

Rules every member follows (`pnpm validate` enforces them):

- Versions come only from `pnpm-workspace.yaml` catalogs (`catalog:<name>`) or `workspace:*`. `catalogMode: strict`.
- `turbo.json` extends `//` with exactly one tier tag; `tsconfig.json` extends one `@stackra/typescript-config` preset.
- Every test file sits directly in a `__tests__/` folder beside its subject (`src/**/__tests__/<name>.test.ts`), anywhere in the repo; no root `tests/`, no `.spec`. App e2e lives in the app. ADR 0022, enforced by `pnpm validate`.
- A package never imports an app, a service or `encore.dev`, nor another package's `src/`.

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
import { user } from "@stackra/service-auth";

// ❌ Package importing from app
import { Login } from "@stackra/console";

// ❌ Service importing from another service
import { stripe } from "@stackra/service-payments";

// ❌ Cross-app import
import { Header } from "@stackra/console/src/header";
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

| Do not introduce                                                                            | Status   | Use instead                                                                          |
| ------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| Encore (`encore.dev`, `~encore/*`) as the service runtime; the backend runtime is undecided | Deferred | independent service members (`/adr/0010-services-are-independent-workspace-members`) |
| `@nestjs/*`; an API gateway in front of services                                            | Rejected | `@stackra/container` (Nest-shaped, no `@nestjs/*`)                                   |
| `reflect-metadata`, type-based auto-wiring                                                  | Rejected | explicit tokens (`/adr/0005-di-container-and-legacy-decorators`)                     |
| Prisma, Drizzle, TypeORM, Knex                                                              | Rejected | MikroORM (`/adr/0014-data-ownership-and-orm`)                                        |
| ESLint, Prettier, Jest                                                                      | Rejected | oxlint, oxfmt, vitest                                                                |
| Express, Fastify as a server framework                                                      | Rejected | the runtime chosen by ADR                                                            |
| Vite+ (`vp`) as task runner                                                                 | Rejected | Turborepo, oxlint, oxfmt, lefthook                                                   |
| A second vault, Doppler, secret values in files, `.env`                                     | Rejected | Infisical + runtime secret store                                                     |
| A second code host in this repo (code host is GitHub)                                       | Rejected | one host (`/adr/0012-code-host-and-ci`)                                              |
| expo-router in the mobile app                                                               | Rejected | code-based React Navigation (`@react-navigation/*`, `react-native-bottom-tabs`)      |
| An AI gateway; a separate-language agent runtime                                            | Rejected | AI SDK core + MCP SDK inside the service                                             |
| A runtime schema engine, server-driven UI, JSONB-for-everything                             | Rejected | coded resources, build-time generation                                               |
| A shared React component library across web and native                                      | Deferred | share types, client, validation, state, i18n, tokens                                 |
| A sync engine (RxDB, ElectricSQL, PowerSync, WatermelonDB)                                  | Deferred | mutation queue with idempotency keys                                                 |
| Typesense, Meilisearch, OpenSearch                                                          | Deferred | Postgres `pg_trgm` + full-text behind a search interface                             |
| OpenFGA, SpiceDB, Cedar                                                                     | Deferred | in-house `check(subject, relation, object)`                                          |
| A separate observability service; Prometheus for business metrics                           | Deferred | platform tracing, metrics, logs                                                      |

Enforcement: `FORBIDDEN_DEPENDENCIES` in `tools/scripts/validate-repository.mjs` (eslint, prettier, jest, nest,
reflect-metadata, prisma, drizzle, express, fastify, typeorm, knex); `boundaries.jsonc` bans `encore.dev` in packages.
Rows naming no package are planned (guardian review). Docs: `/adr/0011-rejected-and-deferred-technologies`.

<!-- source: .agents/rules/secrets.md -->

### Secrets

Stackra uses **two secret mechanisms** (ADR-0009):

#### 1. App Secrets (Encore)

Backend services use Encore's secret manager:

```typescript
import { secret } from "encore.dev/config";

const appSecrets = secret<{
  DatabaseURL: string;
  StripeSecretKey: string;
}>();
```

- Stored in Encore's secret manager (managed)
- Synced from Infisical during deployment
- Service-specific: `/services/backend/<env>`
- Never in git

#### 2. Dev/CI Secrets (Infisical)

All other secrets through Infisical:

##### Vaults Structure

- `/agents` - Developer and agent tokens (local dev)
- `/ci` - CI/CD deployment secrets (staging|prod)
- `/services/backend/<env>` - Service environments
- `/apps/*/<env>` - App-specific secrets (mobile API keys)

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
All token-based MCP servers use `tools/scripts/mcp.sh` vault wrapper (reads from `/agents`).

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

- `guard-bash.mjs`: Blocks `infisical export` or `infisical secrets get` without `--silent`
- `guard-paths.mjs`: Blocks writes to `.env`, `.env.local`, `.env.*`
- `.gitleaks.toml`: Scans for accidental secret commits

#### Enforcement

Each article below is bound to a check:

1. **Secrets never in git** → `gitleaks` pre-commit + CI scan
2. **No .env files** → `guard-paths` hook
3. **MCP tokens from vault** → `mcp.sh` wrapper enforced by `guard-bash`
4. **CI secrets from OIDC** → GitHub Actions OIDC (Phase 2)
5. **App secrets synced** → Encore deployment workflow (Phase 2)

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

Every member declares exactly one tier in its `turbo.json`:

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
- `tools/scripts/validate-repository.mjs` checks tier tags and file existence
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
