---
title: Workspace Layout
always: true
description: Repository directory structure and placement rules
---

# Workspace Layout

Stackra follows a strict tiered structure enforced by Tiers and boundaries.

## Structure

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
│   ├── cross-cutting/      # Brand
│   ├── data/               # Model, database, content, media, search, state machine, assets, filesystem, storage
│   ├── developer/          # CLI, gen (the codegen compiler), coding standard, Vite plugin
│   ├── experience/         # UI, experience, navigation, console, panel, builder, collaboration
│   ├── foundation/         # Contracts, validation, errors
│   ├── infrastructure/     # Pulumi-based infra-* packages
│   ├── runtime/            # Outbox, queue, scheduler, workflow, realtime, locking, cache
│   ├── security/           # Identity, IAM, tenancy, connections, entitlements, licensing
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

## Tier Tags

Every member declares exactly one tier in its `turbo.jsonc`:

- `tier:config` - Tooling presets (no workspace dependencies)
- `tier:lib` - Packages (category-based, never depend on apps/services)
- `tier:app` - Apps and Cloudflare Worker members under `workers/` (never depend on services; ADR 0284)
- `tier:service` - Services in plain TypeScript; Encore is generated into `.stackra/encore` (ADR 0124)

## Placement Test

1. **Is it deployed?** → `tier:service` or `tier:app` (a Cloudflare Worker goes in `workers/<name>`, ADR 0284)
2. **Is it consumed by multiple apps/services?** → `tier:lib` in appropriate category
3. **Is it build/lint/test configuration?** → `tier:config` in `packages/tooling/`
4. **Is it a script?** → `tools/scripts/`
5. **Is it a template?** → `tools/scaffold/`

## What Goes Where

The programming model v3 (ADR 0294, 0295) is the target shape below. Today's members predate it: the console, mobile
app, example and health services and the static Worker still have an authored `src/main.ts`, and
`validate-repository.mjs` (`checkService`) still requires `src/main.ts` and a `stackra.module` field in a service's
`package.json` until STA-339 changes it. Convert nothing by hand ahead of the codemod (STA-344); write new code in the
v3 shape where the member already allows it.

### Every member (ADR 0294 rule R12, ADR 0295)

- Authors `package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts` (one `defineApp`, `defineService`,
  `definePackage` or `defineWorker` call, static data only), `runway.yaml` when it needs runtime resources (ADR 0296),
  `src/**` and `assets/**`
- One root module, `src/<key>.module.ts` (`src/node/<key>.module.ts` in a package); the key is derived from the package
  name
- Nobody writes `main.ts`, an entry barrel or a tool config: gen writes the runtime entries to `.stackra/entry/<target>.ts`
  and every tool config into `.stackra/` (ADR 0295)
- Committed generated contracts at the member root: `stackra.manifest.json` and `openapi.json`
- Tests: `src/**/__tests__/` only (ADR 0022)

### Packages (<category>/<name>)

- Shared code consumed by apps/services, organised by category: foundation, application, communication, etc.
- Entry folders: `src/contracts/` (the leaf: `ports/`, `enums/`, `types/`), `src/config/`, `src/core/`, `src/node/` (the
  module, with the module groups), `src/react/<name>/`, `src/native/<name>/`, `src/testing/` (ADR 0294 decision 15)
- Entries: `.`, `./contracts`, `./node`, `./react`, `./native`, `./testing`; the barrels are generated

### Services (<name>)

- Backend services in plain TypeScript; `stackra gen` emits the Encore app (ADRs 0091, 0124)
- Independent workspace members; feature modules in `src/modules/<key>/`, each with the module groups of ADR 0294
  decision 13 (`models/`, `actions/`, `queries/`, `schemas/`, `enums/`, `errors/`, `events/`, `listeners/`,
  `workflows/`, `access/`, `services/`, `drivers/`, `extensions/`, `resources/<model>/`, `database/{migrations,factories,seeders}/`,
  `ai/`, `functions/`, `constants/`, `types/`), a group appearing with its first file; `database/` is per module,
  its migrations numbered per module, and each module's tables live in its own Postgres schema
- Config classes in `src/config/`; the public type surface in `src/contracts/`

### Apps (<name>)

- Console: Vite web app; Docs: Mintlify documentation site; Mobile: Expo React Native app
- App groups (ADR 0294 decision 14): `src/<key>.module.ts`, `src/app.error.tsx`, `config/`, `routes/<name>/`,
  `components/<name>/`, `blocks/<name>/`, `panels/`, `menus/`, `shortcuts/`, `documents/`, `stores/`, `flags/`,
  `analytics/`, `bridges/`, `hooks/` (two or more importers), `overrides/<owner>/`, `enums/`, `types/`, `styles/`
- Docs (`apps/docs`) is the exception: Mintlify pages, `docs.json` and `assets/` in `src/`

### Workers (<name>)

- Cloudflare Worker members, `@figentra/worker-<name>`, tier `tier:app` (ADR 0284)
- `wrangler.jsonc` at the member root is hand-written until gen writes the Workers config (ADR 0295, STA-339); deployed
  only from CI
- Tests: `src/**/__tests__/`

## Generated Output

- `stackra gen` writes real typed files to `.stackra/gen/` (`routes`, `navigation`, `i18n`, `resources`, `assets`, `clients`, `services`, `permissions`, `settings`, `capabilities`, `wiring`, `hooks`, `schemas`). Code imports them only as `#stackra/<name>`, through the member's `imports` map (ADR 0261, 0233)
- Target: `.stackra/` is fully gitignored, and the committed contract is `stackra.manifest.json` at the member root (ADR 0294 rule R10). Today `.gitignore` still re-includes `.stackra/app-manifest.json`; STA-339 removes the exception
- DI wiring is generated into `.stackra/gen/wiring.ts`; a module is a folder, classes are the only tokens, and authors write no provider lists (ADR 0263 as amended by 0294)

## Forbidden Paths

- No root `tests/` - tests live beside code
- No `src/` in workspace root
- No packages directly in `packages/` - must have category folder
- Tooling presets live in `packages/tooling/<name>/src/` (one flat layer); no `packages/tooling/<name>/src/lib/`. There are
  exactly five: typescript, oxlint, vitest, tsdown and commitlint (ADR 0300)
- Folders named after a retired kind: `links/`, `permissions/`, `guards/`, `hooks/` (inside a module), `states/`,
  `search/`, `repositories/`, `seeds/`, `versions/`, `mails/`, `override-points/`, `tokens/`, `utils/`, `helpers/`
  (ADR 0294, 0130 as amended)

## Enforcement

- `turbo boundaries` checks dependency direction
- `tools/scripts/validate-repository.mjs` checks tier tags, file existence, and config formats: repo-owned config is YAML; `.jsonc` only where the reader has no YAML support (`MUST_STAY_JSONC`), `.json` only where it takes no comments (`MUST_STAY_JSON`)
- `packages/tooling/oxlint/src/boundaries.jsonc` enforces layer rules
- planned — STA-338: the `kind-path` check of the v3 group tables; STA-339: the `member-root`, `tool-configs`, `manifest` and `runway` checks; STA-340: the other v3 validator rows (ADR 0294 to 0296)
- Repo-owned YAML is block style: no flow mappings (`{ a: b }`, empty `{}` aside), flow sequences only for short scalar lists on one line, trailing comments only while the line stays within 100 characters; `checkYamlFlowMaps` in `validate-repository.mjs` enforces it (STA-299)

## See Also

- ADR-0004: Package archetypes and layers
- ADR-0003: Tier dependency direction
- ADR-0294, ADR-0295, ADR-0296: programming model v3, build and entry, runway v3
- Standards: members (required files per tier)
