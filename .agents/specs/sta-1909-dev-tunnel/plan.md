# Implementation Plan: `stackra dev --tunnel`

**Spec**: `spec.md` · **Linear**: STA-1909 · **Branch**: `figentra/sta-1909-dev-tunnel`

| Step | What                                                                                       | Gate           |
| ---- | ------------------------------------------------------------------------------------------ | -------------- |
| 1    | `dev-tunnel/constants/dev-tunnel-settings.constant.ts`: the token variable and the command | oxlint         |
| 2    | `dev-tunnel/functions/start-tunnel.function.ts`: token check, spawn, stop (FR-002, FR-003) | its unit tests |
| 3    | `DEV_COMMAND` takes `--tunnel` and wraps every mode (FR-001)                               | its unit tests |

Tests run on a ci box (`vitest run` in `packages/developer/cli`), never on the Mac.
