# Feature Specification: runway's `cloudflare-workers` provider

**Feature Branch**: `figentra/sta-1921-cloudflare-workers-provider`

**Created**: 2026-11-01

**Status**: Implementing <!-- owner, 2026-11-01: "We need to make it manage everything. Day 1." -->

**Linear**: STA-1921

**Clarifications status**: complete

**Input**: ADR 0352 decision 1 says every deploy goes through a TypeScript provider behind the `RunwayProvider` port,
and workflows only call the CLI. Today, `cloudflare-workers` is a destination name in runway.yaml, but no provider
serves it. Each Worker workflow calls wrangler itself: `runway-cloudflare-workers.yml`, `deploy-registry.yml` (D1
migrations, id injection, `wrangler secret put`) and `deploy-turbo-cache.yml`. Also, no CLI command calls runway's
`deploy()`: `stackra deploy` only knows `--product`. The owner's decision (2026-11-01) is that runway manages every
Cloudflare deploy and nothing calls Cloudflare directly.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/developer/runway` (a new driver, its settings schema, stdin on the command runner, a
  kind filter on `deploy()`), `packages/developer/cli` (`stackra deploy` without `--product`)
- **Cross-service events**: none
- **Tenancy and data**: none. D1 migrations of a Worker run forward only, as the workflow ran them.
- **Secrets**: Worker secrets are named in runway.yaml (`members.<key>.secrets`). Their values come from the deploy
  job's environment, which CI fills from Infisical over OIDC. The provider sends them to `wrangler secret bulk` on
  stdin only: never as an argument, never written to disk, never printed. Binding ids (`members.<key>.ids`) are not
  secrets. They come from the environment so that they stay out of git.
- **ADR needed**: no (ADR 0352 decisions 1, 3 and 6; ADR 0284)
- **New dependencies**: none (`wrangler` is each Worker member's own dev dependency, from `catalog:deploy`)
- **Deploy modes**: Cloudflare Workers, in CI. A terminal run works with the owner's wrangler login (ADR 0352 decision 6).
- **Licence tier**: free
- **Docs to update**: the CLI usage text, and runway.yaml comments in core
- **Lane**: lite
- **Change risk**: R2 (deploy path; handles secrets by name)

## Settings (`targets.cloudflare-workers`)

```yaml
targets:
  cloudflare-workers:
    members:
      registry:
        path: workers/registry # the member folder, from the repository root
        kind: web # the DeployKind whose destination this is (default web)
        ids: # placeholder in wrangler.jsonc, keyed by the environment variable holding the real id
          REGISTRY_D1_DATABASE_ID: "00000000-0000-0000-0000-000000000000"
        d1: [stackra-registry] # `wrangler d1 migrations apply <name> --remote` before the deploy
        vars: [REGISTRY_READ_ONLY] # `--var NAME:<value from the environment>` (plain values only)
        secrets: [REGISTRY_SIGNING_KEY] # `wrangler secret bulk` on stdin after the deploy
        smoke: https://npm.stackra.figentra.com/-/ping
```

## Requirements

- **FR-001** `CloudflareWorkersProviderDriver` (destination `cloudflare-workers`) deploys every member in
  `targets.cloudflare-workers.members` whose `kind` is the target's kind, in the order listed. It skips members that
  its `only` list leaves out. For each member, in order:
  1. `pnpm turbo run build --filter=./<path>`;
  2. put the real ids into the member's `wrangler.jsonc`;
  3. apply the D1 migrations (remote);
  4. `wrangler deploy --message <sha>` with the vars;
  5. `wrangler secret bulk` with the named secrets on stdin;
  6. restore `wrangler.jsonc`, even when a step fails.
- **FR-002** `apply` refuses a checkout other than `sha`, as Mintlify's does. It refuses an id or secret whose
  variable is unset or empty, before any member deploys. It records each member's version id
  (`<key>=<version-id>`, comma-separated).
- **FR-003** `current` reads each member's `wrangler deployments list --json`. It returns the commit when every
  member's latest deployment that carries a commit names the same one. It returns `null` otherwise, and when a
  member has never been deployed.
- **FR-004** `verify` is up when `current` is the record's commit and every member's `smoke` URL answers 2xx.
- **FR-005** `rollback` runs `wrangler rollback <version-id> --message <sha>` for each member, from the record it
  goes back to.
- **FR-006** Invalid settings, such as a missing `members`, a path outside the repository or an unknown field, raise
  `RunwayInvalidError` with the runway.yaml path of the bad field.
- **FR-007** `CommandRunner` takes an optional `input` that is written to the command's stdin.
- **FR-008** `deploy()` takes an optional `kinds` filter. `stackra deploy --env <env> [--kind <k>,…]
[--member <key>,…] [--sha <sha>] [--dry-run]` (no `--product`) reads the root `runway.yaml` and runs `deploy()` with
  the `encore-cloud`, `eas`, `mintlify` and `cloudflare-workers` providers. `--sha` defaults to `HEAD`. A dry run
  prints every target's plan and changes nothing. `--product` keeps today's product path.
- **FR-009** Unit tests cover FR-001 to FR-008 with a fake runner, a fake fetch and a temporary member folder. No
  wrangler and no network.

## Out of scope (next steps on STA-1921)

- Moving `deploy-static.yml`, `deploy-registry.yml` and `deploy-turbo-cache.yml` onto `stackra deploy`. The one-off
  custom-domain detach in `deploy-registry.yml` (the Figentra Registry move) is not carried over.
- The os edge Worker and `publish-shells.mjs` (wrangler environments per runway environment).
- Creating Cloudflare resources such as KV, R2, D1 and routes (`stackra runway infra`).
