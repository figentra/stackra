# Implementation Plan: gen writes the Encore service and an api() adapter per action and query

**Spec**: `.agents/specs/sta-2063-encore-api-adapters/spec.md` · **Linear**: STA-2063 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2063-encore-api-adapters/spec.md`

## Summary

Two pure emitters in gen's core, beside the Encore files gen already writes: `emitEncoreService(ir)` writes
`.stackra/encore/<member>/encore.service.ts` for every service, and `emitEncoreApi(ir, manifest)` writes
`.stackra/encore/<member>/api.ts` with one `api()` per own manifest action or query that has an endpoint. Each adapter
takes its actor from Encore's `getAuthData()` (an anonymous actor when the call opts in to anonymous callers and none
signed in) and runs the call through `ActionPipeline.execute` inside `app.handlers.run`. `generateMember` adds both to
its Encore list.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the gen goldens (`__golden__/`)
- **Storage**: none
- **Runtime target**: a library (gen runs at build time; the generated files run in the Encore app)

## Constitution Check

| Law                                   | Result | Note                                                                                |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen writes `encore.dev` imports as text; no package imports `encore.dev`            |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                                          |
| Security                              | PASS   | the actor comes only from Encore's verified auth data; anonymous only on the opt-in |
| HTTP and events                       | PASS   | routes are the manifest's derived endpoints (ADR 0294 d21); no event changes        |
| Tenancy                               | N/A    | the pipeline's tenancy step is unchanged                                            |
| Delegation                            | PASS   | one agent, one worktree, gen only (plus the http-conventions doc line)              |
| Not built yet (ADR 0011)              | PASS   | Encore stays generated into `.stackra/encore`; no hand-written Encore in a service  |
| Test placement (ADR 0022)             | PASS   | tests beside their subjects in `__tests__/`                                         |
| Versions and catalogs                 | PASS   | no dependency, catalog or lockfile change; the box type-check installs out of tree  |
| Deploy modes (ADR 0076)               | PASS   | build-time output, same in all three                                                |
| Licence tier (ADR 0077)               | PASS   | free package                                                                        |
| Docs and ADRs                         | PASS   | gen README and the http-conventions rule; implements ADR 0091 d2 and ADR 0294 d21   |

## Deploy modes

| Mode       | Behaviour                                                                        |
| ---------- | -------------------------------------------------------------------------------- |
| SaaS       | the generated Encore app gains its service and endpoints; deploys wait on wp-114 |
| On-prem    | the same generated files                                                         |
| Air-gapped | the same generated files                                                         |

## Correctness properties

- **P-001**: For every member, `encore.service.ts` is written exactly when its layout is `service` — Validates: FR-001
- **P-002**: The adapters in `api.ts` are in one-to-one correspondence with the manifest's own action and query entries
  that carry an `endpoint` object and resolvable input and output shapes, each with that entry's method and path —
  Validates: FR-002, FR-006
- **P-003**: Every adapter passes an actor that comes from `getAuthData()`, or, only when the entry is `anonymous`, the
  anonymous fallback — Validates: FR-004, FR-005
- **P-004**: Every adapter calls `execute` with its own entry's class, inside `app.handlers.run` — Validates: FR-003

## Architecture overview

`generateMember` builds the manifest, then pushes the Encore files from a list of emitters
(`generate-member.function.ts:265-273`: CronJobs, database, queues, HTTP, then events). The two new emitters join that
list. `emitEncoreApi` reads `manifest.actions`, keeps the entries with an `endpoint` object and no `from`, resolves the
class from `ir.classes` (by name and module) and the input and output shapes from `ir.shapes` by their `#/schemas/`
refs (the lookup `emitRegistrations` uses for `registerActions`), and prints one adapter per entry.

## Components and responsibilities

- `emitEncoreService(ir)`: `undefined` unless `ir.layout === "service"`; otherwise the generated header,
  `import { Service } from "encore.dev/service";` and `export default new Service("<member>");`.
- `emitEncoreApi(ir, manifest)`: `undefined` unless a service with at least one adapter. Imports: the database import
  (`encoreDatabaseImport`, as every Encore file), `ActionPipeline` from `@stackra/actions`, `ActorKind` and
  `mintPublicId` from `@stackra/contracts` (only when an entry is anonymous), `api` from `encore.dev/api`, `getAuthData`
  from `~encore/auth`, `ENCORE_APP_IMPORT`, then each class and shape. Per entry:

  ```ts
  /** PUT /orders/:orderId/cancel: shop.order.cancel@1 through the action pipeline. */
  export const shopOrderCancelV1 = api(
    { method: "PUT", path: "/orders/:orderId/cancel", expose: true, auth: true },
    (input: CancelOrderInput): Promise<CancelOrderOutput> =>
      app.handlers.run((container) =>
        new ActionPipeline(container).execute(CancelOrderAction, input, {
          actor: getAuthData()!.actor,
        }),
      ),
  );
  ```

  An anonymous entry has `auth: false` and `actor: getAuthData()?.actor ?? { kind: ActorKind.Anonymous, id:
mintPublicId("anon") }`. Local names that clash get an alias, as in `emitCommands`.

- `generateMember`: adds `emitEncoreService(ir)` and `emitEncoreApi(ir, manifest)` to the Encore list.

## Files and folders

- `packages/developer/gen/src/core/functions/emit-encore-service.function.ts` — new
- `packages/developer/gen/src/core/functions/emit-encore-api.function.ts` — new
- `packages/developer/gen/src/core/functions/generate-member.function.ts` — the Encore list
- `packages/developer/gen/src/core/functions/__tests__/emit-encore-service.function.test.ts` — new
- `packages/developer/gen/src/core/functions/__tests__/emit-encore-api.function.test.ts` — new
- `packages/developer/gen/__golden__/{service,consumer,app-clients,member-module-alias}/expected/**/.stackra/encore/**`
  — regenerated
- `packages/developer/gen/README.md` — "Call options from a request"
- `.agents/rules/http-conventions.md` and AGENTS.md — the Authentication example
- `.changeset/sta-2063-encore-api-adapters.md` — minor for `@stackra/gen`

## Data models and migrations

none

## Contracts

- New generated files: `.stackra/encore/<member>/encore.service.ts` (every service) and `.stackra/encore/<member>/api.ts`
  (a service with an own endpoint). Endpoint names: `camelCase` of the key with `@<n>` as `V<n>`.
- The auth data the adapters read from `~encore/auth`: `{ userID: string; actor: Actor }`; wp-114's handler returns it.
- No manifest, action key, permission or event change.

## Error handling

A refusal or error thrown by the pipeline propagates out of the endpoint unchanged; Encore answers it with its default
error until wp-80 maps refusal kinds to `APIError`. With `auth: true`, Encore refuses an unauthenticated call before
the handler runs, so the non-null read of `getAuthData()` holds.

## Security and tenancy

The actor is never read from the body, a path parameter or a header: only from Encore's auth data, which the auth
handler verified. `auth: false` is written only for an entry whose `actors` list `ActorKind.Anonymous`, the same opt-in
the access-control driver honours, so a call that did not opt in is never reachable without a session. The pipeline
still checks permission, record policies and input (`registerActions`). Tenancy is unchanged.

## Testing strategy

- AC-001: the `service` golden (`encore.service.ts.golden`, `api.ts.golden`).
- AC-002, AC-003, AC-004: `emit-encore-api.function.test.ts` over an IR and manifest with an action, a query, an
  anonymous query, an `endpoint: false` action and a hosted entry; plus a package IR (no file).
- FR-001: `emit-encore-service.function.test.ts` (service, package, app).
- AC-005: a box script copies the golden's `api.ts`, `encore.service.ts` and a stand-in `~encore/auth`
  (`getAuthData(): { userID: string; actor: Actor } | null`) into a throwaway folder outside the workspace, installs
  `encore.dev` there with npm (no lockfile change), stubs the member imports, and runs `tsc --noEmit` against
  `encore.dev`'s types.

## Rollout

none (nothing deploys the generated Encore app before wp-114; release note in the changeset)

## Delegation and risk plan

One agent, worktree `.claude/worktrees/sta-2063`; heavy runs on ci-box. Risk: STA-2044 to STA-2047 edit
`generate-member` neighbours and the `service` golden's registrations and boot; merge origin/main before shipping and
keep their behaviour.

## ADRs

ADR 0091 (decision 2), ADR 0294 (decision 21), ADR 0098, ADR 0082; all Accepted. No draft opened.

## Docs

packages/developer/gen/README.md; `.agents/rules/http-conventions.md` (Authentication).

## Complexity tracking

none
