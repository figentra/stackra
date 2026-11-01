# Implementation Plan: first-hour quick fixes

**Spec**: `spec.md` · **Linear**: STA-1818 · **Branch**: `figentra/sta-1818-dx-quick-fixes`

This Mac runs only oxfmt and oxlint; tests run on a box through the testing session (stackra-8a).

| Step | What                                                                  | Gate                |
| ---- | --------------------------------------------------------------------- | ------------------- |
| 1    | Rewrite the "does not ship yet" paragraphs in the rule and skills     | `pnpm agents:check` |
| 2    | The migrations skill points to hand-written migrations until STA-1808 | `pnpm agents:check` |
| 3    | `UnboundTokenError` adds the `stackra gen` hint, with its test        | container tests     |
