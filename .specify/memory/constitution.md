# Stackra Constitution

<!-- generated from apps/docs/src/constitution/*.mdx by tools/scripts/agents-sync.mjs — edit the sources, not this file -->

## Constitution

The constitution holds the rules that do not bend. An [ADR](/adr/index) may refine a law. It may never contradict one. Changing a law is itself an ADR that supersedes the law's previous text, and the law page is updated in the same commit.

| Law | Governs |
| --- | --- |
| [Boundaries](/constitution/boundaries) | tiers, dependency direction, placement, no literals in shared packages |
| [Secrets](/constitution/secrets) | where secret values live, who sets them, what agents may not do |
| [Security](/constitution/security) | authenticated principal, server-side authorization, audit, data classification |
| [HTTP and events](/constitution/http-and-events) | API shape, idempotency, errors, ids, event envelope |
| [Tenancy](/constitution/tenancy) | two-layer tenant isolation, scope tree, isolation tests |
| [Delegation](/constitution/delegation) | who decides, how work is handed to agents, git discipline |

### How the hierarchy works

- **Laws**: This tab. Short, normative, rarely changed.
- **ADRs**: Record one decision each and apply or refine a law. Where an ADR and a law disagree, the law wins and the ADR is wrong.
- **Standards and guides**: [Standards](/standards/members) are operating rules for one kind of member. Guides say how to do a task. Both follow the laws.

### A law names its check

A rule with no check is a comment. Every law below states its enforcement in one of three words:

| Word | Meaning |
| --- | --- |
| **Enforced** | A check exists in this repository and runs in `pnpm verify`, a git hook, an agent hook or CI. The page names it. |
| **Partial** | Some of the rule is checked. The page says which part is not. |
| **Planned** | No check yet. The page names the mechanism. Until it lands, a reviewer refuses a violation by hand. |

A law whose check is planned is still a law. Never lower a rule to make a gate pass: fix the code, or change the law through an ADR.

### Standing principles

Reviewers cite these by name. Each is an application of one of the laws or ADRs and is not a separate rule.

| Principle | Statement | Where it lives |
| --- | --- | --- |
| A service is a runtime boundary | A service is a unit of deployment, not a unit of business meaning. | [Boundaries](/constitution/boundaries) |
| Dependencies point one way | `config` → `lib` → `service` → `app`; nothing points back. | [ADR 0003](/adr/0003-tier-dependency-direction) |
| Core is meaning | A package's core layer states what the package is about. It never depends on transport, an ORM, a driver or a UI toolkit. | [ADR 0004](/adr/0004-package-archetypes-and-layers) |
| The layer that needs an abstraction owns its port | A port lives in `application`, never in `infrastructure`. | [ADR 0004](/adr/0004-package-archetypes-and-layers) |
| Presentation owns delivery | API, React, web and native are delivery surfaces of one package, not separate business layers. | [ADR 0004](/adr/0004-package-archetypes-and-layers) |
| Generated artifacts are never the source of truth | Definitions and hand-written source are authoritative. Generated code is regenerated, never edited. | [Standards](/standards/packages) |
| Shared packages hold factories, apps hold definitions | A shared package never contains a product value. | [Boundaries](/constitution/boundaries) |
| Not built yet means not built | A rejected or deferred technology is not introduced "helpfully". | [ADR 0011](/adr/0011-rejected-and-deferred-technologies) |

### Amending a law

1. Write an ADR that states the new text, the reason and the enforcement. Use the [ADR template](/adr/index).
2. Update the law page in the same commit and say which ADR changed it.
3. Update or add the check. If the check is planned, say so on the page.
4. Get a CODEOWNERS review.

Some pages in this tab describe a mechanism for a thing Stackra does not have yet, such as an Encore app or a tenant-owned table. They say so at the top. The law applies from the moment the thing appears, so the check must exist before it does.

## Boundaries

### Tiers

Every workspace member carries exactly one tier tag in its `turbo.jsonc`. The tag matches its directory.

| Tier | Directory | May depend on |
| --- | --- | --- |
| `tier:config` | `packages/tooling/*` | nothing workspace-local |
| `tier:lib` | `packages/<category>/*` | `config`, other `lib` packages |
| `tier:service` | `services/<name>` | `config`, `lib` |
| `tier:app` | `apps/*` | `config`, `lib`. Talks to services over the wire only. |

The direction is one way. A package never imports an app, a service, or `encore.dev`. An app never imports a service's code. A package never imports another package's `src/`: it uses the package's declared exports. See [ADR 0003](/adr/0003-tier-dependency-direction) and the [package standard](/standards/packages).

**Enforcement: enforced.** Turborepo `boundaries` tags in `turbo.jsonc`, the oxlint `no-restricted-imports` rules in `packages/tooling/oxlint/boundaries.jsonc`, and the tier check in `tools/scripts/validate-repository.mjs`. All run in `pnpm verify`.

### Placement test

Where does new code go?

1. Would a second, unrelated product still need this verbatim? Yes: it is a package in `packages/<category>/`.
2. Does it only compose packages into something that runs or ships? A deployable: a service in `services/<name>` or an app in `apps/<name>`.
3. Would it need renaming to make sense elsewhere? It belongs in the app or service that owns it. It is not a package.

Pick the package category from the [structure guide](/guides/structure). Do not add a category for one package.

**Enforcement: planned.** The package-steward and architecture-guardian agents review every new member. No script can decide placement.

### Shared packages hold factories, apps hold definitions

A package never contains a product enumeration or literal: no brand name, locale list, project id, URL, tenant id or environment value. It exposes `define*()` factories whose types are inferred from the definition the caller passes. The definitions live in the app or service that owns them. A convenience value such as a default locale list is fine. A closed union type of product names is not.

A package never reads `process.env`. Configuration reaches it as an argument or a typed config object that the app builds.

**Enforcement: partial.** `FORBIDDEN_DEPENDENCIES` in the validator blocks forbidden packages. A check for product literals and `process.env` in `packages/**/src` is planned (a validator rule or an oxlint rule). Until then a literal in a shared package is a review finding.

### Service ownership

Services are independent workspace members: `services/<name>` is `@figentra/service-<name>` with entry `src/main.ts`. Encore is deferred (see [ADR 0011](/adr/0011-rejected-and-deferred-technologies)). Until the one-Encore-app decision in [ADR 0010](/adr/0010-services-are-independent-workspace-members) is implemented, the rules below describe the target. They apply from the first service that owns data.

A service owns its API, its database, its schema and migrations, its events, its tests, a `README.md` and an `AGENTS.md` with a PII table. No other service reads that database or imports that service's internals.

| Need | Do |
| --- | --- |
| Read another service's data | Call its API, or subscribe to its events and keep a small local read model. |
| Change another service's data | Call its API inside the caller's flow. If it can be eventually consistent, publish a versioned event and let the owner react. |
| Share a type | Put it in a contract package ([ADR 0015](/adr/0015-contract-packages)). |
| Atomic change across two services | Not allowed. Order the steps so a partial failure is safe and reconcilable. |

**Enforcement: partial.** The validator checks the service-unit files. Cross-service import and database-read rules are planned with the first service that has a database.

### What a contract package is

A shared-types folder is not a contract package. A contract package is a stable boundary with a version and a change policy. Cross-service types live there, and nowhere else.

### Not built yet

Do not introduce a technology on the rejected or deferred list "to be helpful". If a task seems to need one, stop and route to the architecture-guardian. The list and each revival trigger live in [ADR 0011](/adr/0011-rejected-and-deferred-technologies).

**Enforcement: partial.** The forbidden-dependency list in the validator.

## Delegation

This is the law for any session that hands work to another agent. Rule numbers are stable, so other documents may cite them. Claude leads and decides. Work is delegated to Claude models, or to OpenCode (Kimi K3) executors only where `.agents/routing.yaml` routes it, for the steward and executor tiers; reviewers, guardians and the lead never run on OpenCode ([ADR 0066](/adr/0066-delegation-to-opencode-by-routing-matrix), [ADR 0121](/adr/0121-sdlc-tooling-roles-and-linear)). No other model, external agent loop or runner. The reasoning is in [ADR 0017](/adr/0017-agent-roster-and-models).

| # | Rule | Enforcement |
| --- | --- | --- |
| D1 | **Claude decides, executors execute.** ADRs, specs, anything that adds a workspace member, a dependency or a catalog entry, docs, tooling and `pnpm-workspace.yaml` are the deciding session's. Spec tasks whose design names every file, audits, codemods and steward passes may be delegated. | **Planned.** Roster and per-agent tool lists ([roster](/agents/roster)). |
| D2 | **No brief, no run.** A delegated task has a brief with every section filled. A brief that leaves a decision open goes back to the spec. Paths are absolute, commands one per line. | By review. |
| D3 | **One task, one agent per package.** Two parallel agents never edit the same package. The one that needs a shared interface owns the change. | **Planned.** See [concurrent sessions](/agents/concurrent-sessions). |
| D4 | **Executors never write git.** No `add`, `commit`, `push`, `stash`, `reset`, `checkout`, `restore`, `clean`. The dispatcher stages explicit paths and commits. Pushing and publishing are a human's call. | **Partial.** `.agents/hooks/guard-bash.mjs` denies destructive git commands, force-push and manual release tags. A blanket write-git denial for subagents is planned. |
| D5 | **Caps.** At most five agents run at once in a wave. The machine is shared with other sessions. | By review. |
| D6 | **Review by report and gates.** The dispatcher checks the report against the repo, runs `pnpm verify` itself, and compares the diff to the brief's "may touch" and "must not touch" lists. Out-of-brief files are removed. A report that claims green without a verify tail is treated as red. | **Enforced** for the gate: `pnpm verify`. The rest is review. |
| D7 | **Sentinels never look like credentials.** Test values are `sentinel-<topic>-never-printed`. If a test needs a realistic credential shape, assemble it from fragments at runtime. | **Enforced.** gitleaks at pre-commit. |
| D8 | **Do not split a cross-package task into broken halves.** A change to a shared interface is one task. | By review. |
| D9 | **A brief fits one run.** About one package and fifteen files. A larger change is split by layer into briefs that run one after another, each with its own verify. | By review. |
| D10 | **An executor never stops to ask.** Ambiguity is resolved from the design sections the brief names and recorded under "Deviations". | By review. |
| D11 | **Check the report against the repo.** A blocked task usually means the brief omitted something. Find the gap rather than retrying into the same wall. | By review. |

### Brief template

Copy this for every delegated task.

```md
# Brief: <slug>

| Agent       | <agent name>                                 |
| Spec / task | .agents/specs/<NNN>-<slug> · task <id>       |
| Date        | <YYYY-MM-DD>                                 |

## Goal
One sentence. What exists when this run is done.

## Read first (absolute paths, in this order)
- /abs/path/AGENTS.md
- …

## Files you may touch
- packages/<category>/<pkg>/src/… (folders or files; nothing else)

## Files you must not touch
- pnpm-workspace.yaml, pnpm-lock.yaml, knip.jsonc, apps/docs/**, packages/tooling/**, every other package.

## Steps
1. …

## Standards (copy; do not shorten)
The rules from the standards pages that apply to these files. Never run a git command that writes.
One pnpm command at a time.

## Verify (one at a time, all must exit 0)
- pnpm --filter <package> lint
- pnpm --filter <package> typecheck
- pnpm --filter <package> test
- pnpm validate

## Report
Files added, changed, deleted. Test count before and after. The tail of each verify command.
Deviations from the spec with the reason. Anything not done, with the exact reason.
```

The deciding session does not read large files or run builds itself when a brief can describe the work. It spends its context on decisions, brief approval, diff review and commits.

## HTTP and events

Stackra has no HTTP service yet and Encore is deferred ([ADR 0010](/adr/0010-services-are-independent-workspace-members)). The examples use Encore's `api()` because that is the chosen shape. The rules hold for any framework.

### HTTP

| Rule | Detail |
| --- | --- |
| One endpoint per operation | One `api()` per operation, with typed request and response interfaces. No `any`, no `Record<string, unknown>` at a boundary. |
| Authenticated by default | `auth: true`. An exposed endpoint without auth is a public surface and carries a comment saying why. Webhooks use a raw endpoint with signature verification. |
| Verbs follow idempotency | `POST` creates (a second call creates again). `PUT` is an idempotent state transition (`/archive`, `/activate`). `PATCH` is a partial update. `DELETE` only where a row is truly removed. Archive instead. |
| Cursor lists | `cursor` and `limit` (at most 100). Sorting and filtering use explicit allow-lists. Never pass column names through. |
| Prefixed public ids | Ids at the boundary look like `tea_01JQ…`. The handler rejects a mismatched prefix before any query. Internal UUIDs never appear in URLs or responses. The prefix registry lives in the contracts package ([ADR 0015](/adr/0015-contract-packages)). |
| Typed errors | Throw `invalidArgument`, `notFound`, `permissionDenied` or `failedPrecondition` with a stable message. Never a bare `Error`. A cross-tenant miss is `notFound`. |
| Idempotency keys | Every write carries an `Idempotency-Key` header. The service dedupes for 24 hours per tenant. Money-like writes keep their own durable idempotency table and run in one transaction with an audit event. |
| Validation | Boundary validation comes from the TypeScript types plus `Min`, `MaxLen` and similar. Business invariants live in the service layer, not the handler. |
| Streaming | Use streaming endpoints for realtime. Fan out through pub/sub, because a socket only knows its own instance. |
| Generated client | Frontends consume a generated client. It is regenerated, never hand-edited. |

```ts
export const list = api(
  { expose: true, auth: true, method: "GET", path: "/teams" },
  async (req: ListTeamsRequest): Promise<ListTeamsResponse> => {
    const limit = Math.min(req.limit ?? 50, 100);
    // read the principal from request context, never from req
    return teams.list({ ...req, limit });
  },
);
```

**Enforcement: partial.** The validator checks the service-unit files. Planned: an Encore-only lint rule for one endpoint per operation, a rule file `.agents/rules/http-conventions.md` scoped to `services/**`, and a generated-client drift check (`gen:client:check`) in `pnpm verify`.

### Events

Events are facts, not commands. A service publishes one when it needs another to react and does not need an answer now.

| Rule | Detail |
| --- | --- |
| Event first | Cross-service communication is a versioned event unless the caller needs an authoritative decision immediately. Then a typed client call, and only on the allowed list in the [service standard](/standards/services). |
| Topic names | `<service>.<aggregate>.<verb>.v<n>`. |
| Versioning | A breaking payload change bumps the version. The old topic stays alive for the compatibility window named in an ADR. |
| Delivery | Producers write through a transactional outbox. Consumers are idempotent: an inbox keyed by event `id`. |
| Importing a topic | A subscriber may import another service's `Topic` object so it can declare its own subscription. It imports nothing else from that service. |

Envelope, defined once in the contracts package:

```json
{
  "id": "evt_01J…",
  "type": "ticketing.ticket.validated",
  "version": 1,
  "occurredAt": "2026-10-03T10:00:00Z",
  "source": "<service>",
  "tenantId": "…",
  "scopePath": "root.branch1",
  "actor": { "type": "user | service | ai | system", "id": "…" },
  "correlationId": "…",
  "causationId": "…",
  "aggregate": { "type": "ticket", "id": "tkt_01J…", "version": 7 },
  "classification": "internal | confidential | pii",
  "data": {}
}
```

**Enforcement: planned.** A schema check of the envelope in the contracts package, plus contract tests per topic, when the first event exists.

## Secrets

### Two kinds, two mechanisms

| Kind | Where the value lives | Who sets it | How code reads it |
| --- | --- | --- | --- |
| **Application secret** (payment keys, OAuth client secrets, webhook signing secrets, provider API keys) | The runtime's secret store, per environment | A human | By name at runtime through the runtime's binding, for example `secret("NAME")` once Encore lands. Never from a file. |
| **Developer or CI token** (MCP server tokens, CI vendor tokens) | The Infisical vault. `/agents` for developer tokens, `/ci` for CI. Nowhere else. | A human, in Infisical | Developers: `tools/scripts/mcp.sh` injects a token for the server process. CI: OIDC login, then `infisical run` for one step. |

There is no third mechanism. There is no `.env` file, no `.env.example`, and no second vault. A local override for development goes in a gitignored file that holds no value anyone else needs. Rationale: [ADR 0009](/adr/0009-secrets-two-mechanisms). Procedures: [secrets runbook](/runbooks/secrets).

Stackra has no deployed runtime yet, so only the developer-token mechanism and the repository checks are live. The application-secret rules apply from the first service that declares a secret.

### What an agent may do

| An agent may | An agent may not |
| --- | --- |
| Declare `secret("NAME")` in code and name the key and its purpose in its report. | Set, rotate or delete a value. |
| Reference a developer token in `.mcp.json` as a bare `$KEY`. Not `${KEY}`: Claude Code expands that form itself and disables the server when the variable is unset. | Read a value, in any form, into the transcript. |
| Run `tools/scripts/secrets-doctor.mjs` once it exists. It reports names only. | Write a value into a file, test, fixture, log, comment, commit message or chat message. |
| Use sentinel test values such as `sentinel-<topic>-never-printed`. | Add a `.env` file, a second vault, or a sync into the code host. |

### Articles

Each article names the check that enforces it.

| # | Article | Enforcement |
| --- | --- | --- |
| S1 | No secret value in any file in git: source, test, fixture, doc, comment, workflow, lockfile. | **Enforced.** gitleaks (`.gitleaks.toml`) at pre-commit through lefthook and `pnpm secrets:scan`. CI scan arrives with [ADR 0012](/adr/0012-code-host-and-ci). |
| S2 | Manifests and config carry names only. | **Planned.** Covered by S1 today; a name-pattern check comes with the first manifest that lists secrets. |
| S3 | No static credential stored in the code host. Vendor tokens come from Infisical through OIDC. | **Planned.** A CI workflow allowlist check (`secrets-workflow-allowlist`) lands with the CI pipeline. |
| S4 | CI authenticates by OIDC only, with one machine identity per environment. Pull-request jobs can never read production. | **Planned.** A `vault-oidc` composite step plus an OIDC-permissions check, built with the CI pipeline. |
| S5 | A secret is process environment for one step. Never written to a CI env or output file, an artifact, a cache, a log or a comment. | **Partial.** `infisical login --silent` in the steps; the agent hook denies `printenv`. The CI write check is planned. |
| S6 | No `.env`, no `.env.example`, no second vault in any repository. | **Planned.** `secrets-no-dotenv` check in the validator. The agent hook already denies reading `.env` and `.dev.vars`. |
| S7 | An agent never reads a secret value. Agents see names, never values. | **Partial.** `.agents/hooks/guard-bash.mjs` denies `.env`/`.dev.vars` reads, `printenv` and bare `env`, `encore secret set`, and `wrangler secret put`. It does **not** yet deny `infisical export`, `infisical secrets get` without `--silent`, or `encore secret get`. Adding those rules, with a hook test, is planned. Until then an agent must never run them. |
| S8 | Setting, rotating and deleting a value is a human act, in the vault or store. Production changes need a second person once a second maintainer exists. | **Planned.** Vault configuration; CODEOWNERS now. |
| S9 | A test needs zero secrets. `verify` and every test run with no credential. A test that needs a real one is a design finding. | **Partial.** `pnpm verify` takes no secret. gitleaks scans fixtures. |
| S10 | Test values that look like credentials are built at runtime from fragments, so the scanner sees nothing in the diff. | **Enforced** by S1: gitleaks blocks anything else. |
| S11 | The image never bakes a value. | **Planned**, with the first deployable image. |

### When a secret leaks

1. Rotate first, investigate second. The value is compromised the moment it is pushed. Rewriting history does not un-leak it.
2. Record what, when and when it was rotated. Never paste the value.
3. If gitleaks missed the pattern, add it to `.gitleaks.toml`.

### Not allowed

- A third mechanism "just for this one case".
- A `${KEY}` placeholder that a tool or shell expands into a file.
- A secret in a commit message, PR description, chat message, issue or AI prompt.
- Lowering an article so a gate passes. Change the law through an ADR, or fix the code.

## Security

Stackra has no deployed service yet. These laws bind the first service that authenticates a user. Controls that need a service are marked planned.

### Laws

| # | Law | Enforcement |
| --- | --- | --- |
| SEC1 | **One authenticated principal per request.** A single auth handler resolves the caller once. Handlers read it from the request context, never from body, query or client headers. `auth: true` is the default. A public endpoint is a documented exception (health, signed webhooks, public content). | **Planned.** Lint rule for undocumented `expose` without auth, with the first service API ([HTTP and events](/constitution/http-and-events)). |
| SEC2 | **Authorization is server-side**, on every command and query. A client may hide what a user cannot do. It never decides. | **Planned.** Reviewed by the security-tenancy reviewer until a policy engine exists. |
| SEC3 | **Every state change emits an audit record**: actor, tenant, target, before and after references, correlation id. An AI action is attributed to the AI actor and the human who approved it. | **Planned.** |
| SEC4 | **Every data field has a classification**: `internal`, `confidential` or `pii`. PII is redacted from logs, events and errors. Each member's `AGENTS.md` carries a PII table, even if it says "none". | **Partial.** The validator checks that the PII table exists. Redaction is checked by review. |
| SEC5 | **Rate limits** on public and AI endpoints. **Budgets** on AI usage per tenant. | **Planned.** |
| SEC6 | **Supply chain is pinned.** Versions come only from catalogs. Lifecycle scripts are allow-listed. Cache artifacts are signed. Secrets are scanned on every commit. | **Partial.** Catalog check and strict mode in the validator, signed Turborepo cache in `turbo.jsonc`, gitleaks at pre-commit. CodeQL, workflow linting and dependency review arrive with CI ([ADR 0012](/adr/0012-code-host-and-ci)). |
| SEC7 | **Encryption** in transit everywhere. At rest through the provider. Application secrets only through the secret store ([Secrets](/constitution/secrets)). | **Planned.** |

### Effective permission

When an authorization system exists, every service resolves permissions the same way. Do not invent a variant.

```text
effective(principal, tenant, activeScope) =
    grants      live grants for (principal, tenant)      # not expired, not revoked
    applicable  grants whose scope path contains activeScope
    perms       union of role permissions over applicable
                  limited to entitled features
                  limited to token abilities            # API keys only
```

- Results are cached per `(principal, tenant, scope, grantsVersion)`. Any change to grants or roles bumps `grantsVersion`.
- The check is shaped `check(subject, relation, object)` so the engine behind it can be replaced without touching callers.
- A cross-tenant miss is `notFound`, never `permissionDenied`.

### Threat model template

Each service that handles user data keeps a `docs/threat-model.md` in its member folder with three tables. A row with no control is a backlog item, not a gap to forget.

| Section | Columns |
| --- | --- |
| Assets | asset, where it lives, class (`internal`, `confidential`, `pii`, `secret`) |
| Trust boundaries | numbered list: client to gateway, service to service, service to database, any third party |
| Threats and controls | threat, control today, open work |

## Tenancy

**Trigger: the first tenant-owned table.** Stackra has none today and no database. This law is binding from the moment one appears, and the checks below must exist first. It is stated now so the first table is built right, not retrofitted.

### Defence in depth: both layers, always

    Every query against a tenant-owned table runs inside `withTenant(ctx, db => …)` or `withScope(ctx, db => …)`. Each opens a transaction and runs `SELECT set_config('app.tenant_id', $1, true)` with the tenant from the authenticated principal, never from request input. `withScope` also appends the scope-path predicate from the principal's granted paths. A direct query in a handler is a lint failure.

    Every tenant-owned table has `tenant_id uuid NOT NULL`, `ENABLE ROW LEVEL SECURITY` **and** `FORCE ROW LEVEL SECURITY` (the role that owns the table would otherwise bypass RLS), and a policy on `current_setting('app.tenant_id', true)`. A forgotten filter returns zero rows, never another tenant's data.

Hand-written RLS is not allowed. The scoped-table pattern emits the columns, indexes and policy. The mechanism is decided in [ADR 0014](/adr/0014-data-ownership-and-orm), not here. Migrations that backfill tenant tables use a dedicated bypass clause in the policy. Decide it in the migration template, not on the first backfill.

### Scope tree

A tenant's data is organised in a tree of scopes (for example organisation, branch, team). Each scope has an `ltree` path.

| Table kind | Columns |
| --- | --- |
| Is a node | `scope_id uuid PRIMARY KEY`, the same identity as the node, not a copy |
| Belongs to a node | `scope_id` plus a denormalised `scope_path ltree` with a GiST index |

Use the OR-expansion `(scope_path <@ $1::ltree OR scope_path <@ $2::ltree …)`. Both `scope_path <@ ANY($paths)` and `$paths::ltree[] @> scope_path` seq-scan on GiST and are forbidden. An empty granted-paths list yields `false`.

### Tenant context

Resolved once per request by the single auth handler into the principal ([Security](/constitution/security)). The tenant is the session's active tenant, a token claim, or an API key's bound tenant. It is never taken from body, query string or a client header. The one client header a handler reads, `X-Scope-Path`, is validated against the granted paths and dropped otherwise.

Cross-tenant access exists only in an explicitly privileged, audited endpoint named by an ADR. Tables that are global by design (a person registry, an auth account store) have no `tenant_id`. They enforce the boundary in code and a migration test pins that.

### Isolation tests

Every service with tenant-owned tables ships an isolation test that proves:

1. Tenant B gets zero rows or a 404 for tenant A's data on list, get, update and delete.
2. A handler written without `withTenant()` returns zero rows (RLS fails closed).

### Enforcement: planned

| Check | When |
| --- | --- |
| Lint rule: no direct query in a handler | With the first scoped table |
| RLS catalog audit: every table with `tenant_id` has `ENABLE` and `FORCE` and a policy | With the first scoped table, in `pnpm verify` |
| `isolation.test.ts` required by the validator once a scoped table exists | With the first scoped table |
| Security-tenancy reviewer agent | Before the first scoped table |
