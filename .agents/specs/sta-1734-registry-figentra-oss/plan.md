# Implementation Plan: the `@figentra-oss` registry scope

**Spec**: `spec.md` · **Linear**: STA-1734 · **Branch**: `figentra/sta-1734-registry-figentra-oss`

| Step | What                                                                      | Gate                                |
| ---- | ------------------------------------------------------------------------- | ----------------------------------- |
| 1    | `workers/registry/migrations/0005_figentra_oss.sql`                       | registry tests and validate via f4  |
| 2    | README scope, publisher and migration lists; ADR 0453 amendment           | format via f4                       |
| 3    | Apply: the owner's "Deploy registry" run (`wrangler d1 migrations apply`) | **owner**; agents never dispatch it |

Applied migrations are never edited; a correction is a new migration.
