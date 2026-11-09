# @stackra/flow-preset

## 0.32.0

No changes in this release.

## 0.31.0

### Patch Changes

- 303c4a4: The agents no longer name files that only core has, so a product's validate stops refusing them. A docs page is a link
  to docs.stackra.figentra.com, a rule is named (the `linear` rule) rather than given its `.agents/rules/…` path, and
  core-only files are named as core's, the same rewrite as Flow's bundled stackra preset (flow#198).

## 0.30.0

No changes in this release.

## 0.29.0

### Patch Changes

- 6f43cd8: `stackra constitution` writes `.flow/constitution.md` (the file Figentra Flow's `flow-*` commands read) from the docs
  laws, and `stackra validate --repository` reports it missing or out of date (`constitution`). It was rendered by core's
  agents-sync script, which retires now that Flow projects `.agents/` (STA-2098 H6).
  
  The stackra preset's workspace-layout rule and guard hint name the docs site as Fumadocs on a Worker (ADR 0514), not
  Mintlify.

## 0.28.0

No changes in this release.

## 0.27.0

No changes in this release.

## 0.26.0

No changes in this release.

## 0.25.0

### Patch Changes

- e997ead: Tenant isolation tests must run on real Postgres. PGlite, the memory database driver and the test container's
  superuser all skip row-level security, so a unit test that "tenant B cannot read tenant A" passes even when the
  policies are wrong.
  
  - `stackra validate --repository` has a new check, `isolation-tier`: a test that imports `assertRowSecurity` or
    `tenantIsolationOptions` from `@stackra/database/testing` or `@stackra/tenancy/testing` must be a `.int.test.ts`.
  - The tenancy rule gains point 8: an isolation test runs in `test:int` on Postgres, as the service role that cannot
    bypass row-level security, with each read inside `TenantIsolationService.withTenant`.
  - The preset ships the `security-tenancy-isolation-test` skill again, rewritten with a working example.

## 0.24.0

No changes in this release.

## 0.23.0

No changes in this release.

## 0.22.0

No changes in this release.

## 0.21.0

No changes in this release.

## 0.20.0

No changes in this release.

## 0.19.0

### Patch Changes

- 003094f: The spec template's example paths name `packages/flow`, not the retired `packages/figentra-flow`.

## 0.18.1

No changes in this release.

## 0.18.0

No changes in this release.

## 0.17.2

No changes in this release.

## 0.17.1

No changes in this release.

## 0.17.0

No changes in this release.

## 0.16.0

No changes in this release.

## 0.15.0

No changes in this release.

## 0.14.4

### Patch Changes

- 0b12a44: Figentra Flow's names, not the old ones (STA-2106): the preset's spec skill runs `fflow gate ci` and `fflow trace ci`,
  its plan template no longer says "Vellum", and its keywords list `fflow`. The renderers' `generator` option names
  `fflow` as its example. Flow's bundled `presets/stackra` gets the same text, so the copies stay byte for byte.

## 0.14.3

No changes in this release.

## 0.14.2

No changes in this release.

## 0.14.1

### Patch Changes

- e05bbe2: The preset's test-infra skill and flow-gate command name the `testbed` CLI from `@figentra/testbed` (ADR 0522) for
  run, status, unlock and scale, in place of `stackra testbed`.
- 470d710: `stackra testbed` is deprecated in favour of `testbed` from `@figentra/testbed` (ADR 0522): it keeps working for
  one release, then goes (ADR 0522 step 8). Install `@figentra/testbed` and call `testbed`; the verbs, flags, exit codes
  and `--json` lines are the same.
  The preset's ci-steward and flow-gate command name `testbed run`.

## 0.14.0

No changes in this release.

## 0.13.0

No changes in this release.

## 0.12.0

No changes in this release.

## 0.11.1

No changes in this release.

## 0.11.0

No changes in this release.

## 0.10.0

### Minor Changes

- 3a25ff1: New package: Stackra's Figentra Flow preset, moved out of Flow's bundled `presets/stackra` so Flow ships only
  `neutral` (STA-2097, PLAN section 9 P2). A repository names it with `fflow preset add @stackra/flow-preset`; its
  `preset.yml` requires Flow `^1.0.0`. The guard tables import Flow's public `@figentra-oss/flow/guard` entries, and the
  `npx -y` MCP servers are pinned: `@heroui/react-mcp` 1.1.4, `@heroui/native-mcp` 1.1.4, `@playwright/mcp` 0.0.84.

### Patch Changes

- 09497a8: The reviewer agents post an advisory `Review (advisory): PASS|FAIL <sha>` comment through `pnpm bot:gh` instead of
  `pnpm bot:review`: the stackra-reviewer App is retired (ADR 0523 decision 6), and nothing counts the comment.

Written by Changesets on release; never edited by hand.
