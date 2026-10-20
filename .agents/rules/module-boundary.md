---
title: Module Boundary
always: true
description: Module boundary and import rules for Stackra
---

# Module Boundary

Packages and services are isolated by tier. The dependency graph flows one way: config → lib → app → service.

## Direction

```
config → lib → app → service
  ↓        ↓       ↓        ↓
  ←────────←───────←───────← (never upstream)
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
import { Button } from "@stackra/experience/button";

// ✅ Service importing from package
import { logger } from "@stackra/foundation/logger";

// ✅ Package importing from lower package
import { config } from "@stackra/foundation/config";

// ✅ Config presets have no imports
import { defineConfig } from "tsdown";
```

## Encore Services

Encore services communicate via:

- **RPC calls** - Encore's typed client
- **Pub/Sub** - Asynchronous messaging
- Never direct imports

## Enforcement

- `turbo boundaries` enforces tier direction
- `packages/tooling/oxlint/boundaries.jsonc` blocks forbidden imports
- `tools/scripts/validate-repository.mjs` checks tier tags

## See Also

- ADR-0003: Tier dependency direction
- ADR-0004: Package archetypes and layers
- Constitution: boundaries (placement test)
