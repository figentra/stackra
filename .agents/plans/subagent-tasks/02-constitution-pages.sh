#!/bin/bash
set -e

cd /Users/akouta/Projects/final-project

echo "=========================================="
echo "SUBAGENT 02: Constitution Pages"
echo "=========================================="

mkdir -p apps/docs/src/constitution

# Constitution: index.mdx
cat > apps/docs/src/constitution/index.mdx << 'CONPAGE'
---
title: Constitution
description: Laws that govern Stackra development
---

# Constitution

Laws outrank Architecture Decision Records (ADRs). A law is a binding rule with enforcement. An ADR refines a law, never contradicts it.

## Hierarchy

1. **Laws** (constitution/) - Binding rules, each with an enforcing check
2. **ADRs** (adr/) - Architecture decisions, cited by laws
3. **Standards** (standards/) - Operating rules, cited by laws
4. **Guides** (guides/) - How-to documentation

## Architecture Principles

1. **Explicit over implicit** - No magic, no reflection, no hidden state
2. **Tier boundaries** - Dependencies flow one way: config → lib → app → service
3. **Data ownership** - Each service owns its schema; no shared entities
4. **Zero secrets in git** - Infisical for dev/CI, Encore secrets for app
5. **One catalog** - All versions from `pnpm-workspace.yaml`
6. **Tests beside code** - No root `tests/` directory
7. **Agents declared** - `.agents/` is source, assistants are projections

## Standing Laws

| law | what it says | enforcement |
|-----|--------------|-------------|
| boundaries | Tiers, dependency direction, placement | turbo boundaries |
| secrets | Two mechanisms, vault-only access | guard-bash + gitleaks |
| http-and-events | Encore conventions, auth by default | oxlint rules |
| module-boundary | No upstream imports | turbo boundaries |

## Claim Without Check

A rule without enforcement is a **comment**. Every law names its check.

If you find a rule without a check, either:
- Add the check (preferred)
- Move it to standards or guides
- Remove it
CONPAGE

echo "✓ constitution/index.mdx"

# Constitution: boundaries.mdx
cat > apps/docs/src/constitution/boundaries.mdx << 'CONPAGE'
---
title: Boundaries
description: Tier dependency direction and package placement
---

# Boundaries

Stackra enforces strict tier boundaries. The dependency graph flows one way.

## Tier Direction

```
tier:config → tier:lib → tier:app → tier:service
   ↓             ↓           ↓            ↓
   ←─────────────←───────────←────────────←
             (never upstream)
```

## Tiers

| tier | what it is | depends on |
|------|-----------|-----------|
| `tier:config` | Tooling presets | Nothing (npm only) |
| `tier:lib` | Packages | config + lower libs |
| `tier:app` | Apps (console, docs, mobile) | lib |
| `tier:service` | Encore services | lib |

## Placement Test

1. **Is it deployed?** → `tier:service` or `tier:app`
2. **Is it shared code?** → `tier:lib` in `packages/<category>/`
3. **Is it build/lint config?** → `tier:config` in `packages/tooling/`

## Forbidden Patterns

```typescript
// ❌ App importing from service
import { auth } from "@stackra/service-auth";

// ❌ Package importing from app
import { Header } from "@stackra/console";

// ❌ Package with hardcoded value
export const API_URL = "https://api.example.com"; // ❌
```

## Packages Hold Factories

Packages expose factories and functions, not literals:

```typescript
// ❌ Package with hardcoded value
export const logger = new Logger({ level: "info" });

// ✅ Package with factory
export function createLogger(config: LoggerConfig) {
  return new Logger(config);
}
```

## Enforcement

- `turbo boundaries` - CI gate check
- `packages/tooling/oxlint/boundaries.jsonc` - Import restrictions
- `tools/scripts/validate-repository.mjs` - Tier tag validation
CONPAGE

echo "✓ constitution/boundaries.mdx"

# Constitution: secrets.mdx
cat > apps/docs/src/constitution/secrets.mdx << 'CONPAGE'
---
title: Secrets
description: Two secret mechanisms with vault enforcement
---

# Secrets

Stackra uses **two secret mechanisms**. Never mix them, never put secrets in git.

## Mechanism 1: App Secrets (Encore)

Backend services use Encore's secret manager:

```typescript
import { secret } from "encore.dev/config";

const appSecrets = secret<{
  DatabaseURL: string;
  StripeSecretKey: string;
}>();
```

- Stored in Encore's managed secret store
- Synced from Infisical during deployment
- Service-specific: `/services/backend/<env>`
- Never in git, never in code

## Mechanism 2: Dev/CI Secrets (Infisical)

All other secrets through Infisical vaults:

### Vault Structure
- `/agents` - Developer and agent tokens (local dev)
- `/ci` - CI/CD deployment secrets (staging|prod)
- `/services/backend/<env>` - Service environments
- `/apps/*/<env>` - App-specific secrets (mobile API keys)

### Usage

**Local:**
```bash
infisical run -- pnpm dev
```

**CI:**
```bash
infisical run --env=staging -- pnpm build
```

**MCP servers:**
Token-based servers use `tools/scripts/mcp.sh` vault wrapper.

## Forbidden

1. **No `.env` files** - Use Infisical injection
2. **No hardcoded secrets** - Not in code, not in git
3. **No secret values in configs** - Only secret references

## Articles

Each article is enforced:

| article | says | check |
|---------|------|-------|
| S1 | Secrets never in git | gitleaks scan |
| S2 | No .env files | guard-paths hook |
| S3 | MCP tokens from vault | guard-bash hook |
| S4 | CI uses OIDC | GitHub Actions OIDC |
| S5 | App secrets synced | Encore deployment |

## Setup

1. Install: `brew install infisical`
2. Init: `infisical init`
3. Configure `.infisical.json`
4. Add secrets to `/agents`
5. Run: `infisical run -- <command>`
CONPAGE

echo "✓ constitution/secrets.mdx"

# Constitution: http-and-events.mdx
cat > apps/docs/src/constitution/http-and-events.mdx << 'CONPAGE'
---
title: HTTP & Events
description: Encore API conventions
---

# HTTP & Events

Stackra backend APIs follow Encore conventions.

## Endpoints

Every endpoint uses `api()` from `encore.dev/api`:

```typescript
import { api } from "encore.dev/api";

export const getUser = api(
  { method: "GET", path: "/users/:id" },
  async ({ id }: { id: string }): Promise<User> => {
    // ...
  }
);
```

## Methods by Idempotency

- `GET` - Safe, idempotent
- `PUT` - Idempotent, replaces
- `DELETE` - Idempotent
- `POST` - Non-idempotent, creates
- `PATCH` - Non-idempotent, partial update

## Authentication

All endpoints authenticated by default:

```typescript
export const getUser = api(
  { method: "GET", path: "/users/:id", auth: true }, // auth: true is default
  async ({ id }, { auth }: { id: string }, authData) => {
    const userId = authData.userID;
    // ...
  }
);
```

Public endpoints opt-out explicitly:

```typescript
export const health = api(
  { method: "GET", path: "/health", auth: false },
  async () => ({ status: "ok" })
);
```

## Request/Response

**Always typed:**

```typescript
interface GetUserRequest { id: string; }
interface User { 
  id: string; // "user_01H2J3K4L5M6N7P8Q9R0"
  email: string;
  createdAt: string; // ISO 8601
}

export const getUser = api(
  { method: "GET", path: "/users/:id" },
  async (req: GetUserRequest): Promise<User> => { /* ... */ }
);
```

**Cursor pagination:**

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

**Prefixed IDs externally:**

```typescript
// External
{ "id": "user_01H2J3K4L5M6N7P8Q9R0" }

// Never expose raw database IDs
```

## Idempotency

Non-GET operations support `Idempotency-Key`:

```typescript
export const createPayment = api(
  { method: "POST", path: "/payments" },
  async (req: CreatePaymentRequest, headers: { "idempotency-key"?: string }) => {
    const key = headers["idempotency-key"];
    // Deduplicate by key
  }
);
```

## Versioning

**Versioned events, not endpoints.**

- Endpoints immutable (no `/v1`, `/v2`)
- Events versioned (`user.created.v1`, `user.created.v2`)
- New endpoint → new path

## Errors

Use Encore's `APIError`:

```typescript
import { APIError } from "encore.dev/api";

throw APIError.notFound("user not found");
throw APIError.permissionDenied("cannot access");
```
CONPAGE

echo "✓ constitution/http-and-events.mdx"
echo ""
echo "✓ Subagent 02 complete"
