# Implementation Plan: gen output type-checks in a consumer

**Spec**: `spec.md` · **Linear**: STA-1894 · **Branch**: `figentra/sta-1894-gen-output-typechecks`

| Step | What                                                                                | Gate                           |
| ---- | ----------------------------------------------------------------------------------- | ------------------------------ |
| 1    | `emitEntities`: annotation and `"~defaults"` property, with unit tests              | gen tests                      |
| 2    | regenerate the 14 committed `entities.gen.ts` and gen's goldens                     | `stackra gen --check`, goldens |
| 3    | preset test: no `.stackra/encore` in the service include                            | typescript-config tests        |
| 4    | os `devices` service in a core worktree: `tsc --noEmit --declaration` of `.stackra` | testbed                        |
