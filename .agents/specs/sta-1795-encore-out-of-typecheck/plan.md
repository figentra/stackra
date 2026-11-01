# Implementation Plan: a service typechecks without encore.dev

**Spec**: `spec.md` · **Linear**: STA-1795 · **Branch**: `figentra/sta-1795-encore-out-of-typecheck`

This Mac runs only oxfmt and oxlint; gen tests, goldens and a services typecheck run on a box through stackra-8a.

| Step | What                                                                            | Gate           |
| ---- | ------------------------------------------------------------------------------- | -------------- |
| 1    | `emitEncoreSqldbTypes`, written beside the boot of a service with a database    | gen unit tests |
| 2    | The `service` golden gains `.stackra/gen/encore-sqldb.d.ts` (`UPDATE_GOLDEN=1`) | golden.test.ts |
| 3    | invoicing#4 typechecks without `encore.dev` installed                           | stackra-8a     |
