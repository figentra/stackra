# @stackra/flow-preset

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
