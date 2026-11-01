# Implementation Plan: the OS template lines on the registry

**Spec**: `spec.md` · **Linear**: STA-1828 · **Branch**: `figentra/sta-1828-registry-internal-src`

| Step | What                                                                                      | Gate                                |
| ---- | ----------------------------------------------------------------------------------------- | ----------------------------------- |
| 1    | `0006_figentra_os.sql` and its test (figentra/stackra#184)                                | registry tests and validate via CI  |
| 2    | `check-publish.ts`: the source ban only outside `internal` scopes; a test for `@figentra` | registry tests via CI               |
| 3    | ADR 0453 amendment of 2026-11-01; README rule and publisher lists                         | format via CI                       |
| 4    | Apply: the owner's "Deploy registry" run (migration and Worker)                           | **owner**; agents never dispatch it |

The scope row is read without its `name_rules`, so `@stackra-pro/ui` (an internal name rule inside a licensed scope)
keeps the source ban.
