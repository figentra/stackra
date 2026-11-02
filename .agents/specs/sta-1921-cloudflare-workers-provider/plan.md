# Implementation Plan: runway's `cloudflare-workers` provider

**Spec**: `spec.md` · **Linear**: STA-1921 · **Branch**: `figentra/sta-1921-cloudflare-workers-provider`

| Step | What                                                                                                         | Gate           |
| ---- | ------------------------------------------------------------------------------------------------------------ | -------------- |
| 1    | `CommandRunner` `input` and `runCommand` writes it to stdin (FR-007)                                         | its unit tests |
| 2    | `core/constants/cloudflare-workers-settings-schema.constant.ts`: the `members` settings (FR-006)             | oxlint         |
| 3    | `node/drivers/cloudflare-workers-provider.driver.ts`: plan, apply, current, verify, rollback (FR-001 to 005) | its unit tests |
| 4    | `deploy()` `kinds` filter (FR-008)                                                                           | its unit tests |
| 5    | `stackra deploy` without `--product`: `runRunwayDeploy` (FR-008)                                             | its unit tests |
| 6    | changesets for `@stackra/runway` and `@stackra/cli`                                                          | changeset      |

Tests run on a ci box (`vitest run` in each member), never on the Mac.
