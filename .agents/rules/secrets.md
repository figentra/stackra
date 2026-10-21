---
title: Secrets
always: true
description: Secret management and environment configuration
---

# Secrets

Stackra keeps production secret values in Infisical. Infisical is the source, and runway syncs them into the runtimes on deploy
(ADR 0173, which supersedes ADR 0009). Secret names are in git; values never are.

**Invariant: nobody reads a value.** A value is set by a human, or by the secret-manager flow (section 3,
ADR 0257), which writes it without anyone, the agent included, ever seeing it.

## 1. App Secrets (Encore, generated app)

Services are plain TypeScript and hold no Encore files. The Encore application is generated into the
gitignored `.stackra/encore` (ADR 0091), and app secrets reach it through Encore `secret()` there:

```typescript
import { secret } from "encore.dev/config";

const stripeSecretKey = secret("STRIPE_SECRET_KEY");
```

- Infisical is the source of production secrets. Runway syncs them into Encore, Cloudflare Workers and EAS on deploy (ADR 0173,
  which supersedes ADR 0009)
- A human sets each value per environment; an agent only names the secret (the secret-manager flow covers the
  runtime store once a tool for it exists; ADR 0257)
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

## 3. The secrets inbox (secret-manager flow, ADR 0257)

The owner drops one file per secret into `~/Secrets-inbox/` (outside every repo, never synced). The file name is
the secret name (`SCREAMING_SNAKE`, one extension stripped: `STACKRA_REVIEWER_PRIVATE_KEY.pem`); an optional
`<NAME>.target.yaml` sets `env` (default `dev`) and `path` (default `/agents`). A non-file value (an App ID) is a
file holding just that value; there is no `--value` flag.

- `pnpm secrets:import --list | --dry-run | <import>` is the only way in. It never prints, logs or passes a value
  on argv, verifies by SHA-256 read-back in-process, deletes the inbox file on success and appends a names-only
  line to `~/.stackra/secrets-audit.log`.
- Production (`--env prod`): the dry run prints a one-time `--confirm <token>` (30 min). That token is a process rule,
  not an enforced yes (the same caller sees it): ask the owner, wait for yes, only then use it. The enforced yes is
  the local request page (STA-187), where the owner's own submit is the yes.
- Any agent may run the script: hooks cannot tell agents apart, and the script never outputs a value. The
  `secret-manager` agent is the one that is told to.
- No agent reads, lists, copies or moves anything in `~/Secrets-inbox/`. The hooks below catch the obvious attempts;
  they are an accident guard, not a security boundary.

## Forbidden Patterns

1. **No `.env` files** - Use Infisical injection
2. **No hardcoded secrets** - Not in code, not in git
3. **No secret values in configs** - Only secret references

### Blocked by Hooks

- `guard-bash.mjs`: Blocks `infisical export`, `infisical secrets get` without `--silent`, a bare `infisical secrets`
  (lists values) and `infisical run -- env|printenv`
- `guard-bash.mjs`: Blocks any command with a path token that names `Secrets-inbox` or the import confirm key, a
  glob rooted at home that could match them, or a recursive read of home (`pnpm secrets:import` never needs to);
  grep/sed/perl/awk patterns, `--title`/`--body`/`-m` values and URLs are not paths (`_inbox.mjs`, shared with the
  OpenCode guard)
- `guard-paths.mjs`: Blocks writes to `.env`, `.env.*`, `.dev.vars`, `.ci-env` and `.sentryclirc`, and every
  Read/Grep/Glob/Write/Edit under `~/Secrets-inbox/`
- `.gitleaks.toml`: Scans for accidental secret commits

## Enforcement

Each article below is bound to a check:

1. **Secrets never in git** → `gitleaks` pre-commit + CI scan
2. **No .env files** → `guard-paths` hook
3. **CI secrets from OIDC** → GitHub Actions OIDC (Phase 2)
4. **Production values reach runtimes by Infisical sync** (ADR 0173, decision 1), and only the `secret-manager` agent writes values through `pnpm secrets:import` (ADR 0173, decision 7; ADR 0257). Review checks the sync, not a manual copy.
5. **Nobody reads a value; the inbox flow writes blind** → `tools/scripts/secrets-import.mjs` (+ its test, which
   asserts no canary value reaches output, audit log or argv), `guard-bash` / `guard-paths` inbox rules

## Setup

1. Install the Infisical CLI: `mise install` (pinned in `mise.toml`, ADR 0027; Homebrew is not supported)
2. Create workspace: `infisical init`
3. `.infisical.yaml` is tracked (workspace id and domain, no secret)
4. Add secrets to `/agents` folder
5. Run commands with `infisical run -- <command>`

## See Also

- Constitution: secrets (laws)
- ADR-0173: Infisical is the source of production secrets (supersedes ADR-0009)
- Runbook: secrets (vault layout, rotation)
