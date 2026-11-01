# Implementation Plan: a package's lang catalogues are importable

**Spec**: `spec.md` · **Linear**: STA-1798 · **Branch**: `figentra/sta-1798-lang-assets-export`

This Mac runs only oxfmt and oxlint; tests and validate run on a box through stackra-8a.

| Step | What                                                                         | Gate                          |
| ---- | ---------------------------------------------------------------------------- | ----------------------------- |
| 1    | access-log and achievements export `./assets/*`                              | juristra typecheck            |
| 2    | `lang-assets` check in `stackra validate --repository`, with its vitest test | cli tests, `stackra validate` |
