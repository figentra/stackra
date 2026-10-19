---
always: true
description: Secret management and environment configuration
---

# Secrets

Stackra uses **two secret mechanisms** (ADR-0009):

## 1. App Secrets (Encore)

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

## 2. Dev/CI Secrets (Infisical)

All other secrets through Infisical:

### Vaults Structure
- `/agents` - Developer and agent tokens (local dev)
- `/ci` - CI/CD deployment secrets (staging|prod)
- `/services/backend/<env>` - Service environments
- `/apps/*/<env>` - App-specific secrets (mobile API keys)

### How to Use

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

### Required Secrets

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

## Forbidden Patterns

1. **No `.env` files** - Use Infisical injection
2. **No hardcoded secrets** - Not in code, not in git
3. **No secret values in configs** - Only secret references

### Blocked by Hooks

- `guard-bash.mjs`: Blocks `infisical export` or `infisical secrets get` without `--silent`
- `guard-paths.mjs`: Blocks writes to `.env`, `.env.local`, `.env.*`
- `.gitleaks.toml`: Scans for accidental secret commits

## Enforcement

Each article below is bound to a check:

1. **Secrets never in git** → `gitleaks` pre-commit + CI scan
2. **No .env files** → `guard-paths` hook
3. **MCP tokens from vault** → `mcp.sh` wrapper enforced by `guard-bash`
4. **CI secrets from OIDC** → GitHub Actions OIDC (Phase 2)
5. **App secrets synced** → Encore deployment workflow (Phase 2)

## Setup

1. Install Infisical CLI: `brew install infisical`
2. Create workspace: `infisical init`
3. Configure `.infisical.json` (workspace ID from Infisical UI)
4. Add secrets to `/agents` folder
5. Run commands with `infisical run -- <command>`

## See Also

- Constitution: secrets (laws)
- ADR-0009: Two secret mechanisms
- Runbook: secrets (vault layout, rotation)
