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
│   ├── communication/      # Webhooks, versioning, integrations, templates, mail
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
└── tools/
    ├── scripts/            # validation, scaffolding
    └── scaffold/           # Templates
.notes/                     # private owner-only submodule; never referenced from public docs
```

## Tier Tags

Every member declares exactly one tier in its `turbo.jsonc`:

- `tier:config` - Tooling presets (no workspace dependencies)
- `tier:lib` - Packages (category-based, never depend on apps/services)
- `tier:app` - Apps (never depend on services)
- `tier:service` - Services in plain TypeScript; Encore is generated into `.stackra/encore` (ADR 0124)

## Placement Test

1. **Is it deployed?** → `tier:service` or `tier:app`
2. **Is it consumed by multiple apps/services?** → `tier:lib` in appropriate category
3. **Is it build/lint/test configuration?** → `tier:config` in `packages/tooling/`
4. **Is it a script?** → `tools/scripts/`
5. **Is it a template?** → `tools/scaffold/`

## What Goes Where

### Packages (<category>/<name>)

- Shared code consumed by apps/services
- Organized by layer: foundation, application, communication, etc.
- Entry point: `src/index.ts`
- Tests: `src/**/__tests__/` only (ADR 0022)

### Services (<name>)

- Backend services in plain TypeScript; `stackra gen` emits the Encore app (ADRs 0091, 0124)
- Independent workspace members
- Entry: `src/main.ts`
- Tests: `src/__tests__/`

### Apps (<name>)

- Console: Minimal Vite app
- Docs: Mintlify documentation site
- Mobile: Expo React Native app
- Entry: `src/main.ts`

## Generated Output

- `stackra gen` writes real typed files to `.stackra/gen/` (`routes`, `navigation`, `i18n`, `resources`, `assets`, `clients`, `services`, `permissions`, `settings`, `capabilities`, `wiring`, `hooks`). Code imports them only as `#stackra/<name>`, through the member's `imports` map (ADR 0261, 0233)
- `.stackra/*` is gitignored; `.stackra/gen/` is never committed and is never edited by hand
- DI wiring is generated into `.stackra/gen/wiring.ts`; a module is a folder and authors write no provider lists (ADR 0263)

## Forbidden Paths

- No root `tests/` - tests live beside code
- No `src/` in workspace root
- No packages directly in `packages/` - must have category folder
- Tooling presets live in `packages/tooling/<name>/src/` (one flat layer); no `packages/tooling/<name>/src/lib/`

## Enforcement

- `turbo boundaries` checks dependency direction
- `tools/scripts/validate-repository.mjs` checks tier tags, file existence, and config formats: repo-owned config is YAML; `.jsonc` only where the reader has no YAML support (`MUST_STAY_JSONC`), `.json` only where it takes no comments (`MUST_STAY_JSON`)
- `packages/tooling/oxlint/src/boundaries.jsonc` enforces layer rules

## See Also

- ADR-0004: Package archetypes and layers
- ADR-0003: Tier dependency direction
- Standards: members (required files per tier)
