# @stackra/flow-preset

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
