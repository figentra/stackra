# stackra

pnpm 12 + Turborepo monorepo. Every rule lives in this repository (`.agents/rules/`, projected below); there are no
global rules. Full guides: `apps/docs` (`pnpm docs`). Every member keeps its code in `src/`.

| Path                                                       | Holds                                                                                                                                                     | Tier tag       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `apps/console`                                             | `@figentra/console` — Vite web app; authored `src/main.ts` until v3 generates the entry (ADR 0295)                                                        | `tier:app`     |
| `apps/mobile`                                              | `@figentra/mobile` — Expo app; authored `src/main.ts` until v3 generates the entry (ADR 0295)                                                             | `tier:app`     |
| `apps/docs`                                                | `@figentra/docs` — Mintlify; pages in `src/docs/` (ADRs in `src/docs/adr`), site config `src/config/docs.config.ts`                                       | `tier:app`     |
| `packages/<category>/<name>`                               | `@stackra/<name>`, flat inside one category: foundation, application, communication, cross-cutting, data, developer, experience, runtime, security, state | `tier:lib`     |
| `packages/tooling/*`                                       | `@stackra/{typescript,oxlint,vitest,tsdown,commitlint}-config`, exactly five presets (ADR 0300)                                                           | `tier:config`  |
| `services/<name>`                                          | `@figentra/service-<name>` — one member per service (`example`, `health`); root module `src/<key>.module.ts` (ADR 0294)                                   | `tier:service` |
| `workers/<name>`                                           | `@figentra/worker-<name>` — Cloudflare Worker members (`static`: `stackra-static`, static.stackra.figentra.com), `wrangler.jsonc`, ADR 0284               | `tier:app`     |
| `tools/scripts`                                            | `validate-repository.mjs` (+ test); `scaffold.mjs` (+ test) — `pnpm new <kind> <name>`, templates in `tools/scaffold`                                     | —              |
| `.agents/hooks`, `.claude/settings.json`, `opencode.jsonc` | agent hooks and config                                                                                                                                    | —              |
| `.notes`                                                   | private owner-only submodule (`git submodule update --init .notes`); CI and agents never need it; never reference its contents from public docs           | —              |

Rules every member follows (`pnpm validate` enforces them):

- Versions come only from `pnpm-workspace.yaml` catalogs (`catalog:<name>`) or `workspace:*`. `catalogMode: strict`.
- `turbo.jsonc` extends `//` with exactly one tier tag, then its category and runtime tags; `tsconfig.json` extends one
  `@stackra/typescript-config` preset.
- `package.json` carries `keywords`, `repository` (with `directory`), `homepage`, `bugs`, `author`, `engines` and
  `"stackra": { "kind": "package", "tier", "category", "runtimes", "summary" }`, checked against
  `STACKRA_MANIFEST_SCHEMA` and the folder (ADR 0453 decision 11, amendment of 2026-10-27; `/standards/members`).
- Every test file sits directly in a `__tests__/` folder beside its subject (`src/**/__tests__/<name>.test.ts`), anywhere in the repo; no root `tests/`, no `.spec`. App e2e lives in the app. ADR 0022, enforced by `pnpm validate`.
- A package never imports an app, a service or `encore.dev`, nor another package's `src/`.
- A JSON config is `.jsonc` (comments welcome) when its tool reads JSONC; tsconfig files keep `.json` and take comments.
  The files that must stay strict `.json`, with the reason, are `MUST_STAY_JSON` in `tools/scripts/validate-repository.mjs`.

The programming model v3 is the target for new code (ADR 0294, 0295, 0296): a class declares its kind by its base
class, each file sits in its kind's one home group, identities are derived and locked in `stackra.manifest.json`, and
nobody writes `main.ts` or a tool config. No member is converted yet (STA-344) and its checks are planned (STA-338,
STA-339, STA-340), so today's code and `validate-repository.mjs` still show the older shapes.

Done = `pnpm verify` green (format, lint, typecheck, test, build, validate, boundaries, knip). Conventional commits.

Scope: every package is `@stackra/*` (free) or `@stackra-pro/*` (Pro, ADR 0461), never renamed and never another npm scope; publishing goes only to the Stackra registry (`https://npm.stackra.figentra.com/`, ADR 0453) from `.github/workflows/release.yml`, never npmjs or Keygen.

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

Create a worktree per agent **inside the repository**, under `.claude/worktrees/<name>` (gitignored). Never create
one next to the repository (`../<name>`): sibling folders pile up in `~/Projects` and outlive their branch.

```bash
# From the repository root
git worktree add .claude/worktrees/sta-123 -b figentra/sta-123-slug origin/main
cd .claude/worktrees/sta-123
pnpm install
# Agent works here; another agent works in the main checkout or its own worktree

# After the PR merges
git worktree remove .claude/worktrees/sta-123
git branch -D figentra/sta-123-slug
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

- `pnpm-workspace.yaml` - Only the owner (or the agent the owner assigns)
- `turbo.jsonc` - Only the owner (or the agent the owner assigns)
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

- Planned: `guard-paths.mjs` does not read `.agents/locks/` yet; lock files are a convention, not a check
- Planned: nothing records or enforces agent boundaries yet; `session-context.mjs` re-states the repo invariants and branch, not file ownership
- `pnpm verify` after a merge is the only coordination check

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

Services are plain TypeScript. You never write `encore.dev`, `api()` or `encore.service.ts` in a service: behaviour is
an action or a query class (ADR 0098 as amended by 0294), and `stackra gen` emits the Encore `api()` adapters into the
gitignored `.stackra/encore/` (ADR 0091, 0124). The rules below are what the generated endpoints must satisfy, so they
shape how you author actions.

The programming model v3 (ADR 0294) is the target. `@stackra/actions` and gen do not ship yet, so the shapes below are
the contract they will implement, not code that runs today; the package docs win once they ship.

#### Action or query

| Question       | Action                              | Query                                   |
| -------------- | ----------------------------------- | --------------------------------------- |
| Changes state? | Yes: `extends Action({ key, ... })` | No: `extends Query({ key, ... })`       |
| Risk           | From its permission, L0 to L4       | From its permission, L0 or L1 only      |
| HTTP method    | `POST`, `PUT`, `PATCH` or `DELETE`  | `GET`                                   |
| MCP tool       | Only with `tool: true`              | Yes, under the caller's own permissions |
| Cache          | Never                               | May take a `cache` option (ADR 0305)    |
| Preconditions  | `preconditions: [...]`              | None                                    |

#### Endpoints

An action or query is exposed over HTTP by convention: gen derives the route from its key, so nothing is declared per
action (ADR 0294 decision 21, ADR 0217 as amended). Input and output are the parameter and return types of `handle`.
A raw endpoint that is not an action (`/api/auth/*`, streaming) is a class that extends `Controller({ path })`, in
the module's `raw/` group; the `@Controller` decorator is retired (ADR 0294). An inbound webhook is a `WebhookEvent<Integration>({ type })`
class (ADR 0308).

| Key                                    | Route                       |
| -------------------------------------- | --------------------------- |
| `x.list`                               | `GET /xs`                   |
| `x.get`                                | `GET /xs/:xId`              |
| `x.create`                             | `POST /xs`                  |
| `x.update`                             | `PATCH /xs/:xId`            |
| `x.delete`                             | `DELETE /xs/:xId`           |
| Any other action verb, input has `xId` | `PUT /xs/:xId/<verb-kebab>` |
| Any other action verb, otherwise       | `POST /xs/<verb-kebab>`     |
| Any other query name                   | `GET /xs/<name-kebab>`      |

`endpoint: { method, path }` overrides the route and `endpoint: false` removes it. An action whose actors include
neither a user nor an agent gets no public endpoint.

```typescript
// src/modules/orders/schemas/cancel-order-input.schema.ts — the input, one declaration per file (ADR 0305)
export class CancelOrderInput extends Schema {
  orderId!: PublicId<"ord">;
}
```

```typescript
// src/modules/orders/actions/cancel-order.action.ts — orders.order.cancel@1, PUT /orders/:orderId/cancel
import type { CancelOrderInput } from "#modules/orders/schemas/cancel-order-input.schema";
import type { CancelOrderOutput } from "#modules/orders/schemas/cancel-order-output.schema";

export class CancelOrderAction extends Action({
  key: "order.cancel",
  actors: [ActorKind.User, ActorKind.Agent],
}) {
  constructor(private readonly orders: OrderService) {
    super();
  }

  async handle(input: CancelOrderInput, ctx: ActionContext): Promise<CancelOrderOutput> {
    const order = await this.orders.findOneOrFail(input.orderId);
    await ctx.authorize(order); // the permission from the key, refined by OrderPolicy#cancel
    // ...
  }
}
```

#### Methods

HTTP methods **by idempotency**:

- `GET` - Safe, idempotent, no body (queries only)
- `PUT` - Idempotent state transition (`/archive`, `/activate`), per the HTTP and events law
- `DELETE` - Idempotent
- `POST` - Non-idempotent, creates resources
- `PATCH` - Non-idempotent, partial update

#### Authentication

Every endpoint is authenticated by default. A public endpoint opts out explicitly with `auth: false` in the action's
or query's options; the flag applies to its API area (ADR 0082), and the gateway enforces it (ADR 0237):

```typescript
export class GetHealthQuery extends Query({ key: "health.get", auth: false }) {
  async handle(): Promise<HealthOutput> {
    // ...
  }
}
```

The caller is the typed `Actor` the action pipeline provides (ADR 0098); never read a user id from the request body.
The permission is derived from the key, and record rules run through `ctx.authorize(record)` (ADR 0132 as amended).

#### Request/Response

##### Always typed

Input and output are `Schema` classes whose TypeScript types are the rules (ADR 0095 as amended by 0294). Each Input and Output is its own file in `schemas/` (ADR 0305). A `number`
carries `@Int` or `@Num`; constraints are `@Str`, `@Int`, `@Num` and `@List`. Gen compiles each class to one Zod schema
in `#stackra/schemas`; authors write no Zod except through the `@Field(zod)` escape hatch with a `// reason:` comment.

```typescript
export class UserView extends Schema {
  id!: PublicId<"usr">;

  email!: Email;

  createdAt!: Date; // ISO 8601 on the wire
}
```

##### Cursor pagination

```typescript
export class ListUsersInput extends CursorInput {} // cursor, limit 1–100 (default 20)

export class ListUsersOutput extends Page.of(UserView) {} // items, nextCursor, hasMore
```

##### Prefixed IDs

Use prefixed ids externally (`usr_01H2J3K4L5M6N7P8Q9R0`, typed `PublicId<"usr">`); never expose database ids.

#### Idempotency

Non-GET operations support the `Idempotency-Key` header. The action pipeline has an idempotency step (ADR 0098, 0138),
so an action declares `idempotency:` in its options and the pipeline deduplicates; do not hand-roll key storage in a
handler. The pipeline order is tenancy, permission, precondition, entitlement, flag, idempotency, interceptors, then
`handle` (ADR 0138 as amended).

#### Versioning

**Versioned events, not endpoints.**

- Endpoints are immutable (no `/v1`, `/v2`)
- An integration event writes its `name` once; gen derives `<module-key>.<name>.v<n>` (`identity.user.created.v1`, ADR 0141 as amended). A breaking change sets `version: n` and adds a `Change<Subject>({ ... })` class beside the event (ADR 0305)
- New endpoint → new path
- API versions are dates: the `Stackra-Version` header, pinned per API key or OAuth app, through the dormant `@stackra/versioning` package. Paths stay unversioned (`/adr/0118-api-versioning-dormant-package`)

#### Error Handling

Throw a typed error from the action: a class that extends `Refusal({ kind })`, whose code is derived from its name
(`OrderNotPayableError` → `order_not_payable`). The generated adapter maps it to the matching HTTP status (not found,
permission denied, invalid argument, precondition failed, and so on). The error envelope and its kinds follow ADR 0140.
Never build HTTP responses by hand and never import `APIError` in a service.

#### Enforcement

- `validate-repository.mjs` (`checkService`) refuses Encore files in a service (ADR 0124)
- planned — STA-340: the gen checks for an endpoint collision, GET on an action or non-GET on a query, a query above
  L1, `cache` on an action and a precondition on a query; until gen ships, review (`api-contract-reviewer`) checks this
  rule

#### See Also

- Constitution: http-and-events
- ADR-0091, ADR-0124: Encore is generated into `.stackra/encore`
- ADR-0294: programming model v3 (kinds, endpoint convention, derived identities); ADR-0098: actions are the unit
- ADR-0010: Services are independent members
- ADR-0082 (API areas and auth), ADR-0237 (generated gateway), ADR-0140 (error envelope), ADR-0141 (event names)
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

`.commitlintrc.yaml` (`refs-issue-key`, lefthook and the Quality Gate over the PR range); `linear.mjs check-pr`
in the Quality Gate; `requireIssue` in `tools/scripts/delegate.mjs`; `.github/workflows/linear-sync.yml`
(`tools/scripts/linear-reconcile.mjs`) moves states, closes decided ADR issues and labels stale work.

<!-- source: .agents/rules/module-boundary.md -->

### Module Boundary

Packages and services are isolated by tier. The dependency graph flows one way: config → lib → app and service. Apps and services are peers (ADR 0003): neither imports the other.

#### Direction

```
config → lib → app
             → service
(never upstream; app and service never import each other)
```

#### Rules

1. **No upstream imports** - A tier never imports from tiers above it
2. **No cross-app imports** - Apps don't import from other apps
3. **No cross-service imports** - Services don't import from other services (use events or the generated client)
4. **Packages import from own layer or below** - Never from apps/services
5. **Inside a package, entries point one way** - `src/contracts/` is a leaf; `core` imports `contracts`; `node`, `react` and `native` import `core`; `testing` imports them all. No symbol is exported from two entries (ADR 0294 decision 15, ADR 0117 as amended)
6. **Sibling modules import only public groups** - a module reaches a sibling only through its exported classes, `schemas/`, `enums/`, `events/`, `errors/`, `access/*.permissions.ts` and `extensions/*.extension-point.ts`, and through `models/` only from `models/` and `database/`, for relations (ADR 0294 decision 24). Imports use `#modules/<key>/<group>/...` (ADR 0233 as amended)

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

// ❌ A sibling module's private group
import { OrderPricingService } from "#modules/orders/services/order-pricing.service"; // not exported by OrdersModule
```

#### Allowed Patterns

```typescript
// ✅ App importing from package
import { STACKRA_THEME } from "@stackra/tokens";

// ✅ Service importing from package
import { logger } from "@stackra/logger";

// ✅ Package importing from lower package
import { config } from "@stackra/config";

// ✅ A sibling module's public group
import { OrderPermissions } from "#modules/orders/access/order.permissions";
```

#### Services

Services communicate through the generated Encore app (ADRs 0091 and 0124):

- **Integration events** - a class that extends `IntegrationEvent({ name })` from `@stackra/events` (ADR 0305); the author writes `name` once and gen derives the wire name `<module-key>.<name>.v<n>` (`identity.user.created.v1`). A consumer is a `Listener` whose `handle(event: E)` parameter type is the producer's event (ADR 0078, 0141 and 0264 as amended by 0294)
- **Typed client calls and events** - `stackra gen` generates one typed client per service from its committed `stackra.manifest.json`, injected through the constructor from `#stackra/clients`: `client.x.y(input)` to call and `client.x.y.queue(input)` for a queued call (ADR 0260, 0261 as amended by 0294). A consumed module is imported by name from its service's client subpath, `import { OrdersModule } from "#stackra/clients/commerce"`, and never as a namespace walk such as `Commerce.modules.Orders` (ADR 0305)
- **Read models** - a consumer's copy of another service's data is a class that extends `Projection<Source>({ ... })` in the module's `models/` group, fed by that service's integration events (ADR 0163, 0260 and 0294)
- Transport is a driver behind the port (ADR 0142). Never direct imports of another service's source, tables or `Topic`
- A Stackra package that needs service data defines a port (an abstract class) in `src/contracts/ports/`; the service implements it (ADR 0260)
- Feature modules live in one of three homes: the service (default), a figentra-os `@figentra/*` package used by two or more OS consumers, or a `@stackra/*` package with no Figentra rules. The module layout is the same in all three (ADR 0259 as amended by 0294)

Classes are the only DI tokens, and configuration is a `Config` class declared as `Config({ schema, env })` (ADR 0145 and 0146 as amended by 0294 and ADR 0305). Names and casing follow ADR 0231 and 0294.

Today's code: the v3 shapes above are the target. No framework package ships yet, the example service still has an
authored `src/main.ts`, and older pages still name `app-manifest.json`; the conversion is STA-344.

#### Enforcement

- `turbo boundaries` enforces tier direction
- `packages/tooling/oxlint/src/boundaries.jsonc` blocks forbidden imports
- `tools/scripts/validate-repository.mjs` checks tier tags
- planned — STA-340: the `contracts`-is-a-leaf and sibling-module boundary rules in `boundaries.jsonc`; STA-339: the `entries` validator check

#### See Also

- ADR-0003: Tier dependency direction
- ADR-0004: Package archetypes and layers
- ADR-0294: Programming model v3 (groups, entries, sibling imports)
- ADR-0305: Programming model v3.1 (partners, one declaration per file, optional root modules, events, extensions)
- ADR-0141 (event names), ADR-0142 (transport drivers), ADR-0145 (tokens are classes), ADR-0231 (naming and casing standard)
- Constitution: boundaries (placement test)

<!-- source: .agents/rules/naming-and-casing.md -->

### Naming and casing

Every name follows ADR 0231 (`/adr/0231-naming-and-casing-standard`) as amended by the programming model v3, ADR 0294
(`/adr/0294-programming-model-v3-grammar-folders-identities-and-naming`), as amended by v3.1, ADR 0305
(`/adr/0305-programming-model-v3-1-names-partners-files-and-class-components`). The summary is below. A name that no row covers
needs an ADR before use. v3 is the target: no member in this repository has been converted yet (STA-344), so existing
code may still show the older forms; write new code in the v3 form.

- **Code style**: whole words; acronyms cased as words (`userId`, `ApiClient`, `loadHttpUrl`); no `I` prefix; abbreviations only `id`, `url`, `api`, `db`, `i18n`, `ui` (so `kbd` is refused: the package is `@stackra/shortcuts`); booleans `is`, `has`, `can`; handlers `on` or `handle`; React hooks `use`; module-level constants SCREAMING_SNAKE.
- **Files**: kebab-case `<name>.<kind>.ts(x)` in the kind's one home group (ADR 0294 decisions 1 and 13 to 15). Input and Output schemas live in `schemas/`, and a component's Props in `<name>.props.ts` (ADR 0305). **Packages**: `@stackra/<kebab>`; services `@figentra/service-<kebab>`.
- **Class names**: one declaration per file, named `PascalCase(stem) + PascalCase(kind)`: `cancel-order.action.ts` exports `CancelOrderAction`. Noun kinds (model, schema, enum, event, signal, analytics event, type) take no suffix; error classes end in `Error`. No companions: `<Name>Input` and `<Name>Output` (action, query, prompt), `<Name>Props` (component) and `<Name>Data` (notification) each live in their own file (ADR 0305).
- **Overrides and kind bases** (ADR 0305, 0306): an override keeps the plain name of what it overrides and imports its base as `Base<Name>`. A kind base is named `PascalCase(kind)`, and a kind factory takes no `define` prefix (`Driver(...)`, not `defineDriver(...)`). `define*` is reserved for the four `stackra.config.ts` functions.
- **Identities are derived, not typed** (ADR 0294 decision 20): module key from the folder, member key from the member folder name, permission `<module>.<model>.<verb>` from a `<Model>Permissions` static, error code from the class name. Written once: an action or query `key` (`order.cancel`, which becomes `orders.order.cancel@1`), an event `name` (`order.paid`, which becomes `orders.order.paid.v1`), a route `path`. `stackra.manifest.json` locks each one; a change needs `@Renamed(old)`.
- **Public ids**: `<prefix>_<26 characters>`, typed `PublicId<"ord">`; only a seeder's `static ids` spells one out. **Branches**: `figentra/sta-<n>-<slug>`.
- **Wire identifiers keep dots**: action keys `orders.order.cancel@1`, permissions `orders.order.cancel`, events `orders.order.paid.v1`.
- **Machine codes** (categories, error codes, refusal codes, event reasons, gen error codes): snake_case.
- **URL paths**: kebab-case, plural, derived from the key by the endpoint convention (`http-conventions`). **JSON keys and query parameters**: camelCase.
- **Database**: snake_case plural tables in the module's Postgres schema (`orders.order_lines`); `idx_`, `fk_` and `ck_` names for indexes, foreign keys and check constraints.
- **Environment variables and secrets**: SCREAMING_SNAKE. Public values use `VITE_`, `EXPO_PUBLIC_` or `RENDERER_VITE_` and never hold a secret. Server values use `STACKRA_`, `FIGENTRA_` or `MAIN_VITE_`. Secrets are `<PROVIDER>_<PURPOSE>`. Tool-reserved prefixes are `ENCORE_`, `TURBO_`, `NODE_`, `CI`, `GITHUB_`, `INFISICAL_`, `EAS_`.
- **Namespace lookups** (i18n keys, assets, templates, stubs) use `<module>::<path>`, for example `orders::actions.order.cancel.confirm` and `flags::public/images/eg.svg`.
- **Locales**: folders and overlays use BCP 47 case (`assets/lang/ar-SA/`, `en-US`), and the catalogue layout is set by ADR 0305; URL prefixes stay lowercase (`/ar-sa/`, ADR 0297).
- **DI**: classes are the only tokens. A constructor parameter names its dependency by its type; a port is an abstract class; a named instance is the type `Named<Port, "x">`. `defineToken`, string tokens, `@Inject` and `@Injectable` are retired (ADR 0145, 0263 as amended by 0294).
- **One meaning per word** (ADR 0294 decision 23): Precondition, never Guard or Gate; extension point and extension, never a backend hook; an extension point's slots are `before` and `after`, and an `Interceptor` wraps one action call (ADR 0305); Hook means a React `use*` function only; Provider means a React context component only (DI registrations are bindings); Command means a CLI command only; Lifetime, never scope, for DI. Banned identifiers: `*Guard`, `*Gate`, `*HookPoint`.
- **The decorator test**: if the folder, the suffix, the base class, a field type, a method name or a derived name already says it, write no decorator. Only field, method (`@Step`, `@Transition`) and class-facet decorators exist; there are no kind decorators.

Enforcement: planned — STA-338 (`base-matches-suffix` and the validator's `kind-path` check), STA-340 (the decorator-registry checks, the `names` validator row for abbreviations and banned identifiers, the gen checks `kind_class_name` and `identity_changed`), and oxlint `unicorn/filename-case` and the house rules of ADR 0129. Nothing here is checked yet.

<!-- source: .agents/rules/not-built-yet.md -->

### Not built yet

If a task seems to need one of these, stop and route to the owner. Rejected means no; deferred
means not yet. A row changes only by a new ADR. Full table with revival triggers: `/adr/0227-rejected-and-deferred-technologies-refreshed` (it supersedes `/adr/0011-rejected-and-deferred-technologies`).

| Do not introduce                                                                                            | Status   | Use instead                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hand-written Encore (`encore.dev`, `~encore/*`, `encore.*` files) in service members                        | Rejected | plain TypeScript service members; Encore generated by `stackra gen` into `.stackra/encore/`                                                                                                                                                                            |
| `@nestjs/*` as a framework layer                                                                            | Rejected | `@stackra/container` (Nest-shaped, no `@nestjs/*`)                                                                                                                                                                                                                     |
| A separately run gateway product or service in front of services (Kong, Envoy, an own gateway service)      | Rejected | the generated Encore gateway and edge (`/adr/0237-generated-api-gateway-in-four-layers`)                                                                                                                                                                               |
| `reflect-metadata`, `emitDecoratorMetadata`, runtime type-based auto-wiring                                 | Rejected | wiring `stackra gen` writes at build time from constructor parameter types (`/adr/0294-programming-model-v3-grammar-folders-identities-and-naming` decision 17; `/adr/0227-rejected-and-deferred-technologies-refreshed`, note 2026-10-24)                             |
| Prisma, Drizzle, TypeORM, Knex                                                                              | Rejected | MikroORM on the server (`/adr/0014-data-ownership-and-orm`)                                                                                                                                                                                                            |
| MikroORM or any ORM on a client                                                                             | Rejected | `@stackra/storage` (`/adr/0256-client-storage-one-stackra-storage-package`)                                                                                                                                                                                            |
| ESLint, Prettier, Jest                                                                                      | Rejected | oxlint, oxfmt, vitest                                                                                                                                                                                                                                                  |
| Express, Fastify as a server framework                                                                      | Rejected | the service runtime chosen by ADR                                                                                                                                                                                                                                      |
| Vite+ (`vp`) as task runner                                                                                 | Rejected | Turborepo, oxlint, oxfmt, lefthook                                                                                                                                                                                                                                     |
| A second vault, Doppler, secret values in files, `.env`                                                     | Rejected | Infisical + runtime secret store (`/adr/0173-secrets-infisical-is-the-source-of-production-secrets`)                                                                                                                                                                   |
| A second code host in this repo (code host is GitHub)                                                       | Rejected | one host (`/adr/0012-code-host-and-ci`)                                                                                                                                                                                                                                |
| expo-router in the mobile app                                                                               | Rejected | code-based React Navigation (`@react-navigation/*`, `react-native-bottom-tabs`)                                                                                                                                                                                        |
| Tauri as the desktop shell                                                                                  | Rejected | Electron, one app member with a desktop target (`/adr/0058-desktop-is-electron`)                                                                                                                                                                                       |
| Next.js (`next`, the `app-next` app kind)                                                                   | Rejected | Vite with React Router 7 framework mode (`/adr/0165-web-client-stack-ui-contract-form-adapters-and-no-nextjs`)                                                                                                                                                         |
| Zustand, TanStack Store for client state                                                                    | Rejected | `@stackra/state` (`/adr/0079-client-state-is-stackra-state`)                                                                                                                                                                                                           |
| i18next, react-i18next                                                                                      | Rejected | `@stackra/i18n` (`/adr/0080-i18n-is-the-figentra-i18n-port`)                                                                                                                                                                                                           |
| class-validator, class-transformer                                                                          | Rejected | `@stackra/validation` on Zod (`/adr/0095-zod-inside-field-decorators`)                                                                                                                                                                                                 |
| Better Auth as the identity provider                                                                        | Rejected | ZITADEL (`/adr/0206-zitadel-is-the-identity-provider-and-stackra-identity-is-provider-neutral`)                                                                                                                                                                        |
| Change-data-capture tools (Debezium and similar)                                                            | Rejected | the transactional outbox and integration events; audit through pgaudit and `@AccessLogged`                                                                                                                                                                             |
| XState or another external state-machine library                                                            | Rejected | `@stackra/state-machine` (`/adr/0161-state-machine-package`)                                                                                                                                                                                                           |
| Storybook and `*.stories.*` files                                                                           | Rejected | nothing replaces it; stories files are banned (`/adr/0128-code-conventions-enums-classes-components-and-kind-folders`)                                                                                                                                                 |
| GraphQL                                                                                                     | Rejected | one declaration per action, exposed as MCP tools and REST (`/adr/0217-api-surfaces-mcp-first-plus-rest-sdks-and-rate-limits`)                                                                                                                                          |
| Hand-written gRPC                                                                                           | Rejected | a transport driver behind the port (`/adr/0142-cross-service-transport-through-drivers`)                                                                                                                                                                               |
| Active-active across regions                                                                                | Rejected | two independent regions, GCC and EU, a tenant in one of them; cells within a region come later (`/adr/0186-backups-and-disaster-recovery`)                                                                                                                             |
| An LLM proxy gateway in front of model providers; a separate-language agent runtime (LangGraph and similar) | Rejected | AI SDK core plus MCP SDK inside the service; one MCP gateway in the ai service (`/adr/0155-queries-are-mcp-tools-and-all-ai-code-is-free`)                                                                                                                             |
| A runtime schema engine, JSONB-for-everything, tenant data that carries code, markup or logic               | Rejected | coded resources and build-time generation; allowed: data that only references registered code (L2 UI documents, builder agents, automations, custom fields); tenant logic only in the sandboxed code step (`/adr/0154-tenant-code-runs-only-in-a-sandboxed-code-step`) |
| A shared React component library across web and native                                                      | Deferred | share types, client, validation, state, i18n and tokens, and the `@stackra/ui` contract (`/adr/0165-web-client-stack-ui-contract-form-adapters-and-no-nextjs`)                                                                                                         |
| A sync engine (RxDB, ElectricSQL, PowerSync, WatermelonDB)                                                  | Deferred | mutation queue with idempotency keys                                                                                                                                                                                                                                   |
| Typesense, Meilisearch, OpenSearch                                                                          | Deferred | Postgres hybrid search behind a search interface (`/adr/0221-search-postgres-hybrid-elasticsuite-parity-arabic-and-operations`)                                                                                                                                        |
| OpenFGA, SpiceDB, Cedar                                                                                     | Deferred | in-house `check(subject, relation, object)` behind the policy decision point (`/adr/0208-iam-model-scope-tree-roles-conditions-deny-delegation-and-permission-names`)                                                                                                  |
| A separate observability service; Prometheus for business metrics                                           | Deferred | platform tracing, metrics and logs (`/adr/0184-telemetry-opentelemetry-otlp-slis-heartbeats-and-log-retention`)                                                                                                                                                        |
| Kafka, NATS or Redpanda as the bus                                                                          | Deferred | the event-bus port with its current driver (`/adr/0142-cross-service-transport-through-drivers`)                                                                                                                                                                       |
| A vector store as a separate service                                                                        | Deferred | pgvector in Postgres (`/adr/0160-raw-sql-at-runtime-and-the-approved-postgres-extensions`)                                                                                                                                                                             |
| A graph database                                                                                            | Deferred | ltree in Postgres (`/adr/0160-raw-sql-at-runtime-and-the-approved-postgres-extensions`)                                                                                                                                                                                |
| An OLAP engine                                                                                              | Deferred | Postgres with the approved extensions (`/adr/0160-raw-sql-at-runtime-and-the-approved-postgres-extensions`)                                                                                                                                                            |
| Database sharding                                                                                           | Deferred | one region and one primary; cells come later (`/adr/0186-backups-and-disaster-recovery`)                                                                                                                                                                               |
| Infisical Agent Vault (a credential proxy for coding agents and delegated tasks)                            | Deferred | Infisical paths already in force; the model never sees a secret and egress is direct (`/adr/0267-infisical-agent-vault-deferred`)                                                                                                                                      |
| A browser-extension agent connector (an agent acting inside the user's browser via an extension)            | Deferred | server-side connectors and MCP tools; Playwright in sandboxes for browsing (`/adr/0283-browser-extension-agent-connector-deferred`)                                                                                                                                    |
| A microVM tier for tenant code or other untrusted code                                                      | Deferred | the sandboxed code step and its WASM pool (`/adr/0154-tenant-code-runs-only-in-a-sandboxed-code-step`)                                                                                                                                                                 |
| A second non-TypeScript runtime for services                                                                | Deferred | TypeScript service members (`/adr/0010-services-are-independent-workspace-members`)                                                                                                                                                                                    |

Enforcement: `FORBIDDEN_DEPENDENCIES` in `tools/scripts/validate-repository.mjs` (eslint, prettier, jest, nest,
reflect-metadata, prisma, drizzle, express, fastify, typeorm, knex, expo-router, zustand, @tanstack/store, i18next,
react-i18next, class-validator, class-transformer, meilisearch, @opensearch-project/opensearch); `boundaries.jsonc` bans `encore.dev` in packages.
Planned: extend `FORBIDDEN_DEPENDENCIES` with `next`, `better-auth`, `xstate`, `@storybook/*` and `graphql` (0227).
Rows naming no package are planned (architecture-guardian review). Docs: `/adr/0227-rejected-and-deferred-technologies-refreshed`.

<!-- source: .agents/rules/secrets.md -->

### Secrets

Stackra keeps production secret values in Infisical. Infisical is the source, and runway syncs them into the runtimes on deploy
(ADR 0173, which supersedes ADR 0009). Secret names are in git; values never are.

**Invariant: nobody reads a value.** A value is set by a human, or by the secret-manager flow (section 3,
ADR 0257), which writes it without anyone, the agent included, ever seeing it.

#### 1. App Secrets (Encore, generated app)

Services are plain TypeScript and hold no Encore files. The Encore application is generated into the
gitignored `.stackra/encore` (ADR 0091), and app secrets reach it through Encore `secret()` there:

```typescript
import { secret } from "encore.dev/config";

const stripeSecretKey = secret("STRIPE_SECRET_KEY");
```

- Infisical is the source of production secrets. Runway syncs them into Encore, Cloudflare Workers and EAS on deploy (ADR 0173,
  which supersedes ADR 0009)
- A human sets each value per environment; an agent only names the secret (the secret-manager flow covers the
  runtime store once a tool for it exists; ADR 0257)
- Never in git

#### 2. Dev/CI Secrets (Infisical)

All other secrets through Infisical:

##### Vault Layout

- dev: `/agents` - Developer and agent tokens (local dev, MCP servers)
- staging|prod: `/ci` - CI/CD deployment secrets

##### How to Use

**Local development:**

A token reaches a process only through the pnpm script that needs it (`pnpm bot:gh`, `pnpm linear`, `pnpm bot:git`),
which wraps `infisical run` itself. Raw `infisical run` hands every `/agents` value to the process it starts, so an
agent's raw `infisical run` asks the owner (ADR 0293). A new flow that needs a token gets its own pnpm script.

**CI/CD:**

A CI job logs in to Infisical by GitHub OIDC for one step and reads `/ci` only (ADR 0009 D2); no token is a repository
secret. Workers deploy from CI with a Cloudflare token read from Infisical `/ci` over GitHub OIDC (ADR 0284, ADR 0289). The Encore deploy stays denied: `encore deploy` is blocked by `guard-bash` and settings until the deploy spike STA-136 (DP2) settles the Encore path.

**MCP servers:**
Token-based MCP servers launch through the `tools/scripts/mcp.sh` vault wrapper (reads from `/agents`). This is a
convention; no hook enforces it.

##### Required Secrets

In Infisical `/agents` (local):

- `GITHUB_PERSONAL_ACCESS_TOKEN` - GitHub MCP
- `STRIPE_SECRET_KEY` - Stripe MCP (optional)
- `CONTEXT7_API_KEY` - Context7 MCP
- `RESEND_API_KEY` - Resend MCP (optional)

In Infisical `/ci` (CI/CD):

- `TURBO_TOKEN` - Turborepo remote cache
- `UNIWIND_AUTH_TOKEN` - Uniwind Pro CI/CD licence for the Quality Gate install (ADR 0310)
- `CLOUDFLARE_API_TOKEN` - Cloudflare Worker deploys from CI (ADR 0284, ADR 0289)
- `ENCORE_API_KEY` - Encore deployment, once a deploy path exists (DP2)
- `SENTRY_AUTH_TOKEN` - Sentry releases (optional)

#### 3. The secrets inbox (secret-manager flow, ADR 0257)

The owner drops one file per secret into `~/Secrets-inbox/` (outside every repo, never synced). The file name is
the secret name (`SCREAMING_SNAKE`, one extension stripped: `STACKRA_REVIEWER_PRIVATE_KEY.pem`); an optional
`<NAME>.target.yaml` sets `env` (default `dev`) and `path` (default `/agents`). A non-file value (an App ID) is a
file holding just that value; there is no `--value` flag.

- `pnpm secrets:import --list | --dry-run | <import>` is the only way in. It never prints, logs or passes a value
  on argv, verifies by SHA-256 read-back in-process, deletes the inbox file on success and appends a names-only
  line to `~/.stackra/secrets-audit.log`.
- Production (`--env prod`): the dry run prints a one-time `--confirm <token>` (30 min). That token is a process rule,
  not an enforced yes (the same caller sees it): ask the owner, wait for yes, only then use it. The enforced yes is
  the local request page (STA-187), where the owner's own submit is the yes.
- Any agent may run the script: hooks cannot tell agents apart, and the script never outputs a value. The
  `secret-manager` agent is the one that is told to.
- No agent reads, lists, copies or moves anything in `~/Secrets-inbox/`. The hooks below catch the obvious attempts;
  they are an accident guard, not a security boundary.

#### Forbidden Patterns

1. **No `.env` files** - Use Infisical injection
2. **No hardcoded secrets** - Not in code, not in git
3. **No secret values in configs** - Only secret references

##### Blocked by Hooks

- `guard-bash.mjs` (rules in `.agents/hooks/_rules.mjs`, shared with the OpenCode guard, ADR 0293): blocks
  `infisical export`, `infisical secrets get` in every form (`--silent` still prints the value), `infisical secrets set`,
  a bare `infisical secrets` (lists values), `infisical run -- env|printenv`, `env`/`printenv`, process-environment
  listings (`ps -E`, `ps eww`, `launchctl procinfo`) and running `bot-token.mjs`, also behind `pnpm exec`, `npx` and
  `mise exec --`. Raw `infisical run`, `infisical secrets delete` and `secrets:import … --confirm` ask the owner.
- `guard-bash.mjs` (matcher `.agents/hooks/_inbox.mjs`, shared with the OpenCode guard): blocks any command in which
  a word, after unquoting, names `Secrets-inbox` (any case) or the import confirm key. Two kinds of word are exempt: a
  grep/rg/ag pattern, and a `--title`/`--body`/`--message`/`-m` value with no `$(` or backtick. Program text
  (`perl -e`, awk, sed) and command-running prose are still checked. Also blocked: a path token (pattern and script
  files, `x=…` assignments, `@file` values and `file://` URLs included) whose glob, rooted at home (`~`, `$HOME`,
  `/Users/<you>`, or relative while the shell's cwd is home, following `cd`), could match the inbox; and a recursive
  read (`grep -r`, `rg`, `find`, `du`, `cp -a/-r`, `tar`, `rsync`, `zip`) of home or above, including no path operand
  from home. `pnpm secrets:import` never needs to do any of these.
- `guard-paths.mjs`: Blocks writes to `.env`, `.env.*`, `.dev.vars`, `.ci-env` and `.sentryclirc`, reads of secret
  files (`.env*` except `.env.example`, `.dev.vars`, `*.pem`, `*.key`, `.secrets.local.*`), and every
  Read/Grep/Glob/Write/Edit under `~/Secrets-inbox/`
- `.claude/settings.json` and `opencode.jsonc`: the same denies as prefix rules, the floor in every mode
- `.gitleaks.toml`: Scans for accidental secret commits

#### Enforcement

Each article below is bound to a check:

1. **Secrets never in git** → `gitleaks` pre-commit + CI scan
2. **No .env files** → `guard-paths` hook
3. **CI secrets from OIDC** → GitHub Actions OIDC (Phase 2)
4. **Production values reach runtimes by Infisical sync** (ADR 0173, decision 1), and only the `secret-manager` agent writes values through `pnpm secrets:import` (ADR 0173, decision 7; ADR 0257). Review checks the sync, not a manual copy.
5. **Nobody reads a value; the inbox flow writes blind** → `tools/scripts/secrets-import.mjs` (+ its test, which
   asserts no canary value reaches output, audit log or argv), `guard-bash` / `guard-paths` inbox rules

#### Setup

1. Install the Infisical CLI: `mise install` (pinned in `mise.toml`, ADR 0027; Homebrew is not supported)
2. Create workspace: `infisical init`
3. `.infisical.yaml` is tracked (workspace id and domain, no secret)
4. Add secrets to `/agents` folder
5. Run the pnpm script that wraps the command (`pnpm bot:gh`, `pnpm linear`); the owner runs raw `infisical run`

#### See Also

- Constitution: secrets (laws)
- ADR-0173: Infisical is the source of production secrets (supersedes ADR-0009)
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
4. **Catalog changes reviewed by the owner** - version bumps affect the entire repo
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
│   ├── application/        # Actions, AI, IR, registry
│   ├── commerce/           # Money, ledger and pricing primitives
│   ├── communication/      # Webhooks, versioning, integrations, notifications
│   ├── cross-cutting/      # Concerns that span layers
│   ├── data/               # Model, database, content, media, search, state machine, assets, filesystem, storage
│   ├── design-system/      # Stackra Design System: tokens, ui, icons
│   ├── developer/          # CLI, gen (the codegen compiler), coding standard, Vite plugin
│   ├── experience/         # Experience, navigation, console, panel, builder, collaboration
│   ├── foundation/         # Contracts, validation, errors
│   ├── infrastructure/     # Pulumi-based infra-* packages
│   ├── runtime/            # Outbox, queue, scheduler, workflow, realtime, locking, cache
│   ├── security/           # Identity, IAM, scope, tenancy, entitlements, licensing
│   └── state/              # Settings, feature flags, theming
├── services/               # tier:service
│   ├── example/            # Reference service (plain TypeScript)
│   └── health/             # Health check service
├── workers/                # tier:app (Cloudflare Workers, ADR 0284)
│   └── static/             # stackra-static: hosted static files at static.stackra.figentra.com
└── tools/
    ├── scripts/            # validation, scaffolding
    └── scaffold/           # Templates
.notes/                     # private owner-only submodule; never referenced from public docs
```

#### Tier Tags

Every member declares exactly one tier in its `turbo.jsonc`:

- `tier:config` - Tooling presets (no workspace dependencies)
- `tier:lib` - Packages (category-based, never depend on apps/services)
- `tier:app` - Apps and Cloudflare Worker members under `workers/` (never depend on services; ADR 0284)
- `tier:service` - Services in plain TypeScript; Encore is generated into `.stackra/encore` (ADR 0124)

After the tier tag come `category:<c>` (packages only) and one `runtime:<r>` per entry of the `package.json`
`stackra.runtimes`, in that order (ADR 0453 decision 11, amendment of 2026-10-27); the boundary rules read tier tags only.

#### Placement Test

1. **Is it deployed?** → `tier:service` or `tier:app` (a Cloudflare Worker goes in `workers/<name>`, ADR 0284)
2. **Is it consumed by multiple apps/services?** → `tier:lib` in appropriate category
3. **Is it build/lint/test configuration?** → `tier:config` in `packages/tooling/`
4. **Is it a script?** → `tools/scripts/`
5. **Is it a template?** → `tools/scaffold/`

#### What Goes Where

The programming model v3 (ADR 0294, 0295) is the target shape below. Today's members predate it: the console, mobile
app, example and health services and the static Worker still have an authored `src/main.ts`, and
`validate-repository.mjs` (`checkService`) accepts a service in that shape (with a `stackra.module` field) or in the v3
shape that `pnpm new` writes until STA-344 converts them. Convert nothing by hand ahead of the codemod (STA-344); write
new code in the v3 shape where the member already allows it.

##### Every member (ADR 0294 rule R12, ADR 0295)

- Authors `package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts` (one `defineApp`, `defineService`,
  `definePackage` or `defineWorker` call, static data only), `runway.yaml` when it needs runtime resources (ADR 0296),
  `src/**` and `assets/**`
- The root module is optional. `src/<key>.module.ts` (`src/node/<key>.module.ts` in a package) is written only when it states something gen cannot derive; a member with none is one module keyed by its folder name (ADR 0305, ADR 0294 2026-10-23 item 14)
- Exempt from `stackra.config.ts` and the root module: the docs app (`apps/docs`, Mintlify, no TypeScript runtime) and
  the `tier:config` presets in `packages/tooling/` (tool configuration, no module); the planned `member-root` check
  (STA-339) skips them
- Nobody writes `main.ts`, an entry barrel or a tool config: gen writes the runtime entries to `.stackra/entry/<target>.ts`
  and every tool config into `.stackra/` (ADR 0295)
- Committed generated contracts at the member root: `stackra.manifest.json` and `openapi.json`
- Tests: `src/**/__tests__/` only (ADR 0022)

##### Packages (<category>/<name>)

- Shared code consumed by apps/services, organised by category: foundation, application, communication, etc.
- Entry folders: `src/contracts/` (the leaf: `ports/`, `enums/`, `types/`), `src/config/`, `src/core/`, `src/node/` (the
  module, with the module groups), `src/react/<name>/`, `src/native/<name>/`, `src/testing/` (ADR 0294 decision 15)
- Entries: `.`, `./contracts`, `./node`, `./react`, `./native`, `./testing`; the barrels are generated

##### Services (<name>)

- Backend services in plain TypeScript; `stackra gen` emits the Encore app (ADRs 0091, 0124)
- Independent workspace members; feature modules in `src/modules/<key>/`, each with the module groups of ADR 0294
  decision 13 (`models/`, `actions/`, `queries/`, `schemas/`, `enums/`, `errors/`, `events/`, `listeners/`,
  `workflows/`, `access/`, `services/`, `drivers/`, `extensions/`, `integrations/`, `connections/`, `resources/<model>/`,
  `database/{migrations,factories,seeders,macros,sequences}/`, `ai/`, `functions/`, `constants/`, `types/`), a group appearing with its
  first file; `database/` is per module, its migrations numbered per module, and each module's tables live in its own
  Postgres schema
- Config classes in `src/config/`; the public type surface in `src/contracts/`
- Three kinds added by ADR 0294's amendment of 2026-10-24: a sequence is `database/sequences/<name>.sequence.ts` (ADR 0342), a
  product's data class is `access/<name>.data-class.ts` (ADR 0341), and an edition's model addition is
  `models/<base>.model-addition.ts` (ADR 0336)
- A migration is a frozen snapshot: it imports only `@stackra/database` and `#stackra/migrations`, and its tables and columns are literals (ADR 0159, v3.1 note)

##### Apps (<name>)

- Console: Vite web app; Docs: Mintlify documentation site; Mobile: Expo React Native app
- App groups (ADR 0294 decision 14, ADR 0305): `src/<key>.module.ts` (optional), `config/`, `routes/<name>/`,
  `components/<name>/`, `blocks/<name>/`, `panels/`, `menus/`, `shortcuts/`, `documents/`, `stores/`, `flags/`,
  `analytics/`, `bridges/`, `hooks/` (two or more importers), `schemas/`, `errors/`, `enums/`,
  `types/`, `styles/`
- Overrides of any package or service live in one tree, `src/overrides/<owner>/`, which mirrors the owner's paths (ADR 0306)
- No hand-written native code in an app: Swift and Kotlin live only in Expo module packages, one package per hardware or OS capability, behind a TypeScript port with a mock driver (ADR 0478)
- Docs (`apps/docs`) has its own layout (ADR 0002, 2026-10-27 amendment): pages in `src/docs/`, `assets/` and `snippets/` in `src/`, the site in `src/config/docs.config.ts`; gen assembles the Mintlify site into `.stackra/site/`

##### Workers (<name>)

- Cloudflare Worker members, `@figentra/worker-<name>`, tier `tier:app` (ADR 0284)
- `wrangler.jsonc` at the member root is hand-written until gen writes the Workers config (ADR 0295, STA-339); deployed
  only from CI
- Tests: `src/**/__tests__/`

#### Generated Output

- `stackra gen` writes real typed files to `.stackra/gen/` (`routes`, `navigation`, `i18n`, `resources`, `assets`, `clients`, `services`, `permissions`, `settings`, `capabilities`, `wiring`, `hooks`, `schemas`). Code imports them only as `#stackra/<name>`, through the member's `imports` map (ADR 0261, 0233)
- Target: `.stackra/` is fully gitignored, and the committed contract is `stackra.manifest.json` at the member root (ADR 0294 rule R10). Today `.gitignore` still re-includes `.stackra/app-manifest.json`; STA-339 removes the exception
- DI wiring is generated into `.stackra/gen/wiring.ts`; a module is a folder, classes are the only tokens, and authors write no provider lists (ADR 0263 as amended by 0294)

#### Forbidden Paths

- No root `tests/` - tests live beside code
- No `src/` in workspace root
- No packages directly in `packages/` - must have category folder
- No `assets/overrides/` folders and no `.override.tsx` files: overrides live in `src/overrides/<owner>/` (ADR 0306)
- Tooling presets live in `packages/tooling/<name>/src/` (one flat layer); no `packages/tooling/<name>/src/lib/`. There are
  exactly five: typescript, oxlint, vitest, tsdown and commitlint (ADR 0300)
- Folders named after a retired kind: `links/`, `permissions/`, `guards/`, `hooks/` (inside a module), `states/`,
  `search/`, `repositories/`, `seeds/`, `versions/`, `mails/`, `override-points/`, `tokens/`, `utils/`, `helpers/`
  (ADR 0294, 0130 as amended)

#### Enforcement

- `turbo boundaries` checks dependency direction
- `tools/scripts/validate-repository.mjs` checks tier tags, file existence, and config formats: repo-owned config is YAML; `.jsonc` only where the reader has no YAML support (`MUST_STAY_JSONC`), `.json` only where it takes no comments (`MUST_STAY_JSON`)
- `packages/tooling/oxlint/src/boundaries.jsonc` enforces layer rules
- planned — STA-338: the `kind-path` check of the v3 group tables; STA-339: the `member-root`, `tool-configs`, `manifest` and `runway` checks; STA-340: the other v3 validator rows (ADR 0294 to 0296)
- Repo-owned YAML is block style: no flow mappings (`{ a: b }`, empty `{}` aside), flow sequences only for short scalar lists on one line, trailing comments only while the line stays within 100 characters; `checkYamlFlowMaps` in `validate-repository.mjs` enforces it (STA-299)

#### See Also

- ADR-0004: Package archetypes and layers
- ADR-0003: Tier dependency direction
- ADR-0294, ADR-0295, ADR-0296: programming model v3, build and entry, runway v3
- ADR-0305, ADR-0306: programming model v3.1 and the overrides tree
- Standards: members (required files per tier)

### Read before touching matching files

- **Service checklist** — `services/**`: read `.agents/rules/service-checklist.md`
- **Task vocabulary** — `**/package.json`, `turbo.jsonc`: read `.agents/rules/task-vocabulary.md`
- **Third-party sources** — `apps/**`, `packages/**`, `services/**`, `workers/**`, `tools/**`: read `.agents/rules/third-party-sources.md`

### On request

- Tenancy — Two-layer tenant isolation rules, plus the scope-tree rules (free code; depth by plan). Read when adding the first tenant-owned table or touching tenant-scoped code; not loaded by default. (`.agents/rules/tenancy.md`)

<!-- END generated from .agents/rules -->
