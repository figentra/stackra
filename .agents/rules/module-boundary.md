---
title: Module Boundary
always: true
description: Module boundary and import rules for Stackra
---

# Module Boundary

Packages and services are isolated by tier. The dependency graph flows one way: config → lib → app and service. Apps and services are peers (ADR 0003): neither imports the other.

## Direction

```
config → lib → app
             → service
(never upstream; app and service never import each other)
```

## Rules

1. **No upstream imports** - A tier never imports from tiers above it
2. **No cross-app imports** - Apps don't import from other apps
3. **No cross-service imports** - Services don't import from other services (use Pub/Sub)
4. **Packages import from own layer or below** - Never from apps/services

## Forbidden Patterns

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

## Allowed Patterns

```typescript
// ✅ App importing from package
import { tokens } from "@stackra/brand";

// ✅ Service importing from package
import { logger } from "@stackra/logger";

// ✅ Package importing from lower package
import { config } from "@stackra/config";

// ✅ Config presets have no imports
import { defineConfig } from "tsdown";
```

## Services

Services communicate via (the generated Encore app carries both, ADRs 0091 and 0124):

- **Integration events** - `@OnEvent` on a versioned event name, shapes from the producer's `./contracts` (ADR 0078)
- **Typed client calls** - only where an authoritative answer is needed now
- Never direct imports of another service's source or `Topic`

## Enforcement

- `turbo boundaries` enforces tier direction
- `packages/tooling/oxlint/boundaries.jsonc` blocks forbidden imports
- `tools/scripts/validate-repository.mjs` checks tier tags

## See Also

- ADR-0003: Tier dependency direction
- ADR-0004: Package archetypes and layers
- Constitution: boundaries (placement test)
