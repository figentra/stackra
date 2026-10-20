---
title: Secrets
always: true
description: Secret management and environment configuration
---

# Secrets

Stackra uses **two secret mechanisms** (ADR-0009):

## 1. App Secrets (Encore, generated app)

Services are plain TypeScript and hold no Encore files. The Encore application is generated into the
gitignored `.stackra/encore` (ADR 0091), and app secrets reach it through Encore `secret()` there:

```typescript
import { secret } from "encore.dev/config";

const stripeSecretKey = secret("StripeSecretKey");
```

- Stored in the runtime's secret store (Encore's secret manager), set there by a human; Infisical Secret Sync is not
  adopted (ADR 0009 D8)
- A human sets each value per environment; an agent only names the secret
- Never in git

## 2. Dev/CI Secrets (Infisical)

All other secrets through Infisical:

### Vault Layout

- dev: `/agents` - Developer and agent tokens (local dev, MCP servers)
- staging|prod: `/ci` - CI/CD deployment secrets

### How to Use

**Local development:**

```bash
infisical run -- pnpm dev
infisical run -- encore run
```

**CI/CD:**

A CI job logs in to Infisical by GitHub OIDC for one step and reads `/ci` only (ADR 0009 D2); no token is a repository
secret. No deploy command exists yet (`encore deploy` is denied by `guard-bash`; the deploy path is open, DP2).

**MCP servers:**
Token-based MCP servers launch through the `tools/scripts/mcp.sh` vault wrapper (reads from `/agents`). This is a
convention; no hook enforces it.

### Required Secrets

In Infisical `/agents` (local):

- `HEROUI_PERSONAL_TOKEN` - HeroUI Pro license
- `GITHUB_PERSONAL_ACCESS_TOKEN` - GitHub MCP
- `STRIPE_SECRET_KEY` - Stripe MCP (optional)
- `CONTEXT7_API_KEY` - Context7 MCP
- `RESEND_API_KEY` - Resend MCP (optional)

In Infisical `/ci` (CI/CD):

- `TURBO_TOKEN` - Turborepo remote cache
- `NPM_FIGENTRA_TOKEN` - npm.figentra.com publish token for the release job (ADR 0025)
- `ENCORE_API_KEY` - Encore deployment, once a deploy path exists (DP2)
- `SENTRY_AUTH_TOKEN` - Sentry releases (optional)

## Forbidden Patterns

1. **No `.env` files** - Use Infisical injection
2. **No hardcoded secrets** - Not in code, not in git
3. **No secret values in configs** - Only secret references

### Blocked by Hooks

- `guard-bash.mjs`: Blocks `infisical export`, `infisical secrets get` without `--silent`, a bare `infisical secrets`
  (lists values) and `infisical run -- env|printenv`
- `guard-paths.mjs`: Blocks writes to `.env`, `.env.*`, `.dev.vars`, `.ci-env` and `.sentryclirc`
- `.gitleaks.toml`: Scans for accidental secret commits

## Enforcement

Each article below is bound to a check:

1. **Secrets never in git** → `gitleaks` pre-commit + CI scan
2. **No .env files** → `guard-paths` hook
3. **CI secrets from OIDC** → GitHub Actions OIDC (Phase 2)
4. **App secrets set by a human in the runtime store** → review; no sync (ADR 0009 D8)

## Setup

1. Install the Infisical CLI: `mise install` (pinned in `mise.toml`, ADR 0027; Homebrew is not supported)
2. Create workspace: `infisical init`
3. `.infisical.yaml` is tracked (workspace id and domain, no secret)
4. Add secrets to `/agents` folder
5. Run commands with `infisical run -- <command>`

## See Also

- Constitution: secrets (laws)
- ADR-0009: Two secret mechanisms
- Runbook: secrets (vault layout, rotation)
