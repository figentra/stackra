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

## Tier Tags

Every member declares exactly one tier in its `turbo.jsonc`:

- `tier:config` - Tooling presets (no workspace dependencies)
- `tier:lib` - Packages (category-based, never depend on apps/services)
- `tier:app` - Apps (never depend on services)
- `tier:service` - Encore services (top of graph)

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

- Backend services ( Encore )
- Independent workspace members
- Entry: `src/main.ts`
- Tests: `src/__tests__/`

### Apps (<name>)

- Console: Minimal Vite app
- Docs: Mintlify documentation site
- Mobile: Expo React Native app
- Entry: `src/main.ts`

## Forbidden Paths

- No root `tests/` - tests live beside code
- No `src/` in workspace root
- No packages directly in `packages/` - must have category folder
- No `packages/tooling/<name>/src/lib/` - single layer

## Enforcement

- `turbo boundaries` checks dependency direction
- `tools/scripts/validate-repository.mjs` checks tier tags, file existence, and that every JSON config whose tool reads JSONC is named `.jsonc` (exceptions: `MUST_STAY_JSON`)
- `packages/tooling/oxlint/boundaries.jsonc` enforces layer rules

## See Also

- ADR-0004: Package archetypes and layers
- ADR-0003: Tier dependency direction
- Standards: members (required files per tier)
